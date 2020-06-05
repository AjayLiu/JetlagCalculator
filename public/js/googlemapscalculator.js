var markers = [];

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
    
    if(markers.length >= 2){
      markers[0]["marker"].setMap(null);
      markers.shift();
    }
    // Create a new marker.
    var marker = new google.maps.Marker({
      position:mapsMouseEvent.latLng,
      map:map
    });

    var infoWindow = new google.maps.InfoWindow({content: "HI", position: mapsMouseEvent.latLng});
    
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
          ans = outputCountry;
          infoWindow.setContent(ans);
          infoWindow.open(map, marker);
          markers.push({"marker": marker, "country": ans});
          outputCountry = 'undefined';
        }
      }

  });
}

