var sources = [
    {
        "name": "Aplereum",
        "url": "https://eiger.alpereum.net/api/transactions_address?address="
    }
];

$(function() {
    NProgress.start();

    var sources_html = '';
    $.each(sources, function(i, source) {
        sources_html = "<option value='" + source.url + "'>" + source.name + "</option>";
    });

    if (sources_html != '') {
        var miner_source = $('#miner-source');
        miner_source.html(sources_html);
        miner_source.removeAttr('disabled');
    } else {
        alert('No sources found. Check you sources.json file.');
    }

    $('#miner_url_button').click(function(){

        var address = $('#miner-address').val();
        var source  = $('#miner-source>option:selected').val();

        if (address == '') {
            alert('No address entered');
            return false;
        }
        if (source == '') {
            alert('No address entered');
            return false;
        }

        var url = source + address;
        spinner = new Spinner().spin(document.getElementById('tax-table-spinner'));
        console.log(spinner.el);
        getInfo(url);
    });

    $('#export-to-csv-button').click(function(){
       $('table').tableExport({type:'csv',escape:'false', });
    });

    NProgress.done();
});