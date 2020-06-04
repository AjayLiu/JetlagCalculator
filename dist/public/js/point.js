var outputCountry;

function timeAndCountryAt(pos){
    var nowTime = moment.tz(tzlookup(pos.lat(), pos.lng()));

    grid = codegrid.CodeGrid(); // initialize    
    grid.getCode (pos.lat(), pos.lng(), function (err, code) {
        if(err){
            alert(err);            
        } else {
            outputCountry = getCountryName(code);
        }
    });


    return nowTime.format("hh:mma");    
}