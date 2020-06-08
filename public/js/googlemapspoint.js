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
      if(!waiting){
        // Close the current InfoWindow.
        infoWindow.close();

        // Create a new InfoWindow.
        infoWindow = new google.maps.InfoWindow({position: mapsMouseEvent.latLng});


        // GET LOCAL TIME
        //from point.js
        var waiting = true;
        var ans = timeAndCountryAt(mapsMouseEvent.latLng); 
        WaitResults();
        function WaitResults(){
          if(outputCountry == 'undefined'){
            waiting = true;
            setTimeout(function(){
              WaitResults();
            }, 1);
          } else {
            waiting = false;
            if(outputCountry != "NONE"){
              ans = outputCountry + "<br>" + ans;
            }
            infoWindow.setContent(ans);
            infoWindow.open(map);
            outputCountry = 'undefined';
          }
        }
      }

    });
}