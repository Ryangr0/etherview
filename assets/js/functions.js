var daily_price_list;
var spinner = null;

function createCORSRequest(method, url) {
    var xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);
    } else if (typeof XDomainRequest != "undefined") {
        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);
    } else {
        // Otherwise, CORS is not supported by the browser.
        xhr = null;
    }
    return xhr;
}

function getInfo(url)
{
    var xhr = createCORSRequest('GET', url);
    if (!xhr) {
        throw new Error('CORS not supported');
    }

    xhr.onerror = function() {
        alert('Something went wrong with the request.');
    };

    xhr.onload = function() {
        transactions = JSON.parse(xhr.responseText);
        alignDates(transactions);
    };

    xhr.send();
}
function alignDates(transactions)
{
    var xhr = createCORSRequest('GET', 'https://min-api.cryptocompare.com/data/histoday?fsym=ETH&tsym=USD&limit=800&aggregate=1&e=CCCAGG');
    if (!xhr) {
        throw new Error('CORS not supported');
    }

    xhr.onerror = function() {
        alert('Something went wrong with loading the price list.');
    };

    xhr.onload = function() {
        var from_value = $('#datepicker-from').val();
        var to_value   = $('#datepicker-to').val();

        var from = 0;
        var to   = moment().utc().startOf('day').format('X');

        if (from_value != '') {
            from = moment(from_value, 'MM/DD/YYYY').utc().format('X');
        }
        if (to_value != '') {
            to = moment(to_value, 'MM/DD/YYYY').add(1, 'days').utc().format('X');
        }

        daily_price_list = JSON.parse(xhr.responseText).Data;

        var today = daily_price_list.slice(-1)[0];

        var data = [];

        var total = {
            earned: 0,
            earnings: 0,
            earnings_if_sold_today: 0
        };

        $.each(transactions, function(i, transaction) {
            var transaction_for_data = {};
            var timestamp = moment(transaction.timestamp, 'x');

            var utc_unix_timestamp = timestamp.utc().startOf('day').format('X');

            if (utc_unix_timestamp < from) {
                return true;
            }

            if (utc_unix_timestamp > to) {
                return true;
            }

            var daily_price_object = daily_price_list.filter(function( obj ) {
                return obj.time == timestamp.utc().startOf('day').format('X');
            });

            var date                   = timestamp.format('MM-DD-YYYY');
            var earned                 = transaction.amount;
            var worth_at_time          = daily_price_object[0].close;
            var earnings               = daily_price_object[0].close * transaction.amount;
            var earnings_if_sold_today = today.close * transaction.amount;

            transaction_for_data.date                   = date;
            transaction_for_data.earned                 = earned;
            transaction_for_data.worth_at_time          = worth_at_time;
            transaction_for_data.earnings               = earnings;
            transaction_for_data.earnings_if_sold_today = earnings_if_sold_today;

            total.earned                 += parseFloat(earned);
            total.earnings               += parseFloat(earnings);
            total.earnings_if_sold_today += parseFloat(earnings_if_sold_today);

            data.push(transaction_for_data);
        });

        today.close = accounting.formatMoney(today.close, {symbol: "$"});

        total.earnings               = accounting.formatMoney(total.earnings, {symbol: "$"});
        total.earnings_if_sold_today = accounting.formatMoney(total.earnings_if_sold_today, {symbol: "$"});


        if ($('#group-by').val() != 'none') {
            data = groupTransactions(data);
        }

        console.log(data);

        data = formatTransactions(data);

        console.log(data);

        processTransactions(data, today, total);
    };

    xhr.send();
}

function groupTransactions(transactions)
{
    var group_by          = $('#group-by').val();
    var group_by_singular = group_by.substring(0, group_by.length - 1);
    var group_by_format   = 'DD-MM-YYYY';

    switch (group_by) {
        case 'days':
            group_by_format = 'DD-MM-YYYY';
            break;
        case 'weeks':
            group_by_format = 'WW';
            break;
        case 'months':
            group_by_format = 'MMM YYYY';
            break;
        case 'years':
            group_by_format = 'YYYY';
            break;
    }

    var transactions_to_return = {};
    $.each(transactions, function(i, transaction) {
        var date             = moment(transaction.date, 'MM-DD-YYYY');
        var grouped_date     = date.utc().startOf(group_by_singular);
        var formatted_date   = grouped_date.format(group_by_format);
        var key              = grouped_date.format('X');

        if(transactions_to_return.hasOwnProperty(key)) {
            transactions_to_return[key].date                    = formatted_date;
            transactions_to_return[key].earned                  += transaction.earned;
            transactions_to_return[key].earnings                += transaction.earnings;
            transactions_to_return[key].earnings_if_sold_today  += transaction.earnings_if_sold_today;
            transactions_to_return[key].worth_at_time           += transaction.worth_at_time;
        } else {
            transactions_to_return[key]                         = {};
            transactions_to_return[key].date                    = formatted_date;
            transactions_to_return[key].earned                  = transaction.earned;
            transactions_to_return[key].earnings                = transaction.earnings;
            transactions_to_return[key].earnings_if_sold_today  = transaction.earnings_if_sold_today;
            transactions_to_return[key].worth_at_time           = transaction.worth_at_time;
        }
    });

    // $.makeArray(transactions_to_return);
    // var result = Object.keys(transactions_to_return).map(function(e) {
    //     return transactions_to_return[e];
    // });
    //
    // console.log(result);

    return transactions_to_return;
}

function formatTransactions(transactions)
{
    $.each(transactions, function(i, transaction) {
        transaction.worth_at_time          = accounting.formatMoney(transaction.worth_at_time, {symbol: "$"});
        transaction.earnings               = accounting.formatMoney(transaction.earnings, {symbol: "$"});
        transaction.earnings_if_sold_today = accounting.formatMoney(transaction.earnings_if_sold_today, {symbol: "$"});
    });
}

function processTransactions(transactions, today, total)
{
    var template = $('#tax-table-template').html();
    Mustache.parse(template);   // optional, speeds up future uses
    var rendered = Mustache.render(template, {'transactions' : transactions, 'today': today, 'total': total});
    $('#tax-table').html(rendered);
    spinner.stop();
}