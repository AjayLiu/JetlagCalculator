function timeAt(pos){
    var nowTime = moment.tz(tzlookup(pos.lat(), pos.lng()));
    return nowTime.format("hh:mma");
}