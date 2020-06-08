var markers = [];

function initMap(){

  // Map options
  var options = {
    zoom:2,
    center:{lat:30,lng:0}
  }
  // New map
  var map = new google.maps.Map(document.getElementById('map'), options);

  // Create the initial InfoWindow.
  var startWindow = new google.maps.InfoWindow(
    {content: 'Click on 2 locations to convert their timezones!', position: {lat: 30, lng: 0}});
  startWindow.open(map);
  
    var fpath;
    var isPointA;
  // Configure the click listener.
  map.addListener('click', function(mapsMouseEvent) {
    startWindow.close();

    if(fpath != null)
      fpath.setMap(null);

    if(markers.length >= 2){
      removeMarker(markers[isPointA ? 1 : 0]);
      isPointA = !isPointA;
    } else { 
      isPointA = markers.length == 0;
    }

    // Create a new marker.
    var marker = new google.maps.Marker({
      position:mapsMouseEvent.latLng,
      map:map,
      label: isPointA ? 'A':'B',
    });

    var infoWindow = new google.maps.InfoWindow({content: "HI", position: mapsMouseEvent.latLng});
    
    function removeMarker(m, isClickRemoved){ 
      if(m == markers[0]){
        markers[0]["marker"].setMap(null);
        markers.shift();
      } else {
        markers[1]["marker"].setMap(null);
        markers.pop();
      }

      isClickRemoved = isClickRemoved || false;
      if(isClickRemoved){
        if(markers.length > 0)
          markers[0]["marker"].set('label', 'A');
        if(markers.length > 1)
          markers[1]["marker"].set('label', 'B');
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
        
        if(isPointA)
          markers.unshift({"marker": marker, "country": ans, "window": infoWindow});
        else
          markers.push({"marker": marker, "country": ans, "window": infoWindow});


        //when marker removed
        google.maps.event.addListener(infoWindow, 'closeclick', function(){
          if(markers[0]["window"] == infoWindow)
            removeMarker(markers[0], true);
          else {
            removeMarker(markers[1], true);
          }
          if(fpath != null)
            fpath.setMap(null);
        });

        if(markers.length == 2){
          
          //DRAW FLIGHT PATH
          var flightPlanCoordinates = [
            markers[0]["marker"].position,
            markers[1]["marker"].position 
          ];
          
          var flightPath = new google.maps.Polyline({
            path: flightPlanCoordinates,
            geodesic: false,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 2
          });
          fpath = flightPath;
          fpath.setMap(map);
        }

        outputCountry = 'undefined';
      }
    }

  });

  
}

