function initMap(){

  // Map options
  var options = {
    zoom:2,
    center:{lat:30,lng:0}
  }
  // New map
  var map = new google.maps.Map(document.getElementById('map'), options);

  // Configure the click listener.
  map.addListener('click', function(mapsMouseEvent) {
    // Create a new marker.
    var marker = new google.maps.Marker({
      position:mapsMouseEvent.latLng,
      map:map
    });

    //alert(getReverseGeocodingData(parseFloat(mapsMouseEvent.latLng.lat()), parseFloat(mapsMouseEvent.latLng.lng())));
    // var infoWindow = new google.maps.InfoWindow({
    //   content:
    // });
    // infoWindow.open(map, marker);
  });
}

