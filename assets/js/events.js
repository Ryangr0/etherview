var sources = [
    {
        "name": "Aplereum",
        "url": "https://eiger.alpereum.net/api/transactions_address?address="
    },
    {
        "name": "Ethermine",
        "url": 'http://ethermine.org/api/miner_new/'
    },
    {
        "name": "Etherscan",
        "url": 'http://api.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=99999999&sort=asc&apikey=UBHK27CI936UBB83ZSRMIV338YYIMTUQKZ&address='
    }
];

var selected_source = 'Alpereum';

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
} else {
    alert('The File APIs are not fully supported in this browser.');
}

$(function() {
    NProgress.start();

    $('.datepicker').datepicker({});

    var sources_html = '';
    $.each(sources, function(i, source) {
        sources_html += "<option value='" + source.url + "'>" + source.name + "</option>";
    });

    if (sources_html != '') {
        var miner_source = $('#miner-source');
        miner_source.html(sources_html);
        miner_source.removeAttr('disabled');
    } else {
        alert('No sources found. Check you sources.json file.');
    }

    miner_source.change(function(){
        selected_source = $(this).find(':selected').html();
        switch (selected_source) {
            case 'Ethermine':
                break;
            default:
                break;
        }

        updateUrl();
    });

    $('#miner-address').keyup(function(){
        updateUrl();
    });

    $('#miner_url_button').click(function(){
        spinner = new Spinner().spin(document.getElementById('tax-table-spinner'));
        getInfo(getUrl());
    });

    $('#export-to-csv-button').click(function(){
       $('table').tableExport({type:'csv',escape:'false', });
    });

    updateUrl();

    NProgress.done();
});