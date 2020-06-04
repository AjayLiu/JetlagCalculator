function initMap(){
  // Map options
  var options = {
    zoom:2,
    center:{lat:30,lng:0}
  }
  
  // New map
  var map = new google.maps.Map(document.getElementById('map'), options);
}

function initMapWithMarkers(markers){
  if(markers.length > 0){
    // Map options
    var options = {
      zoom:2,
      center:{lat:30, lng:markers[0].coords.lng}
    }
    
    // New map
    var map = new google.maps.Map(document.getElementById('map'), options);
    
    // Loop through markers
    for(var i = 0;i < markers.length;i++){
      // Add marker
      addMarker(markers[i]);
    }
    // Add Marker Function
    function addMarker(props){
      var marker = new google.maps.Marker({
        position:props.coords,
        map:map,
        //icon:props.iconImage
      });

      // Check for customicon
      // if(props.iconImage){
      //   // Set icon image
      //   marker.setIcon(props.iconImage);
      // }

      // Check content
      if(props.content){
        var infoWindow = new google.maps.InfoWindow({
          content:props.content
        });

        marker.addListener('click', function(){
          infoWindow.open(map, marker);
        });
      }
      
    }  
  } else {
    initMap();
  }
  
}



