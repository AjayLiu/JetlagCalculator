function initMap(){
    // Map options
    var options = {
      zoom:2,
      center:{lat:30,lng:0}
    }
    
    // New map
    var map = new google.maps.Map(document.getElementById('map'), options);

    var myLatlng = {lat: 30, lng: 0};

    // Create the initial InfoWindow.
    var infoWindow = new google.maps.InfoWindow(
        {content: 'Click the map to get the local time there!', position: myLatlng});
    infoWindow.open(map);

    // Configure the click listener.
    map.addListener('click', function(mapsMouseEvent) {
      // Close the current InfoWindow.
      infoWindow.close();

      // Create a new InfoWindow.
      infoWindow = new google.maps.InfoWindow({position: mapsMouseEvent.latLng});
      
      
      // GET LOCAL TIME
      //from point.js
      var ans = timeAndCountryAt(mapsMouseEvent.latLng); 
      setTimeout(function(){
        ans = outputCountry + "<br>" + ans;
        infoWindow.setContent(ans);
        infoWindow.open(map);
      }, 10);

      

    });
}