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
      removeMarker(markers[0]);
    }
    // Create a new marker.
    var marker = new google.maps.Marker({
      position:mapsMouseEvent.latLng,
      map:map
    });

    var infoWindow = new google.maps.InfoWindow({content: "HI", position: mapsMouseEvent.latLng});
    
    function removeMarker(m){ 
      if(m == markers[0]){
        markers[0]["marker"].setMap(null);
        markers.shift();
      } else {
        markers[1]["marker"].setMap(null);
        markers.pop();
      }
    }

    

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

        // Create the event.
        var event = document.createEvent('Event');

        // Define that the event name is 'calc'.
        event.initEvent('calc', true, true);

        // target can be any Element or other EventTarget.
        document.getElementById("calculateListener").dispatchEvent(event);

        
        waiting = false;
        ans = outputCountry;
        infoWindow.setContent(ans);
        infoWindow.open(map, marker);
        markers.push({"marker": marker, "country": ans, "window": infoWindow});
         

        google.maps.event.addListener(infoWindow, 'closeclick', function(){
          if(markers[0]["window"] == infoWindow)
            removeMarker(markers[0]);
          else {
            removeMarker(markers[1]);
          }

         
        });

        outputCountry = 'undefined';
      }
    }

  });
}

