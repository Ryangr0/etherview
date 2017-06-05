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
            transaction_for_data.worth_at_time          = accounting.formatMoney(worth_at_time, {symbol: "$"});
            transaction_for_data.earnings               = accounting.formatMoney(earnings, {symbol: "$"});
            transaction_for_data.earnings_if_sold_today = accounting.formatMoney(earnings_if_sold_today, {symbol: "$"});

            total.earned                 += parseFloat(earned);
            total.earnings               += parseFloat(earnings);
            total.earnings_if_sold_today += parseFloat(earnings_if_sold_today);

            data.push(transaction_for_data);
        });

        today.close = accounting.formatMoney(today.close, {symbol: "$"});

        total.earnings               = accounting.formatMoney(total.earnings, {symbol: "$"});
        total.earnings_if_sold_today = accounting.formatMoney(total.earnings_if_sold_today, {symbol: "$"});
        processTransactions(data, today, total);
    };

    xhr.send();
}

function processTransactions(transactions, today, total)
{
    var template = $('#tax-table-template').html();
    Mustache.parse(template);   // optional, speeds up future uses
    var rendered = Mustache.render(template, {'transactions' : transactions, 'today': today, 'total': total});
    $('#tax-table').html(rendered);
    spinner.stop();
}