$( document ).ready(function() {
        
    $('#sleepInput').timepicker({
        'minTime': '10:00pm',
        'maxTime': '9:30pm',
    });
    
    
    $('#sleepInput').on('changeTime', function() {
        calculate();
    });
    
    
    
    $('#wishInput').timepicker({
        'minTime': '9:00pm',
        'maxTime': '8:30pm',
    });
    
    
    $('#wishInput').on('changeTime', function() {
        calculate();
    });



    $("#result").hide();

    $( "#calculateButton" ).click(function() {
        
        calculate();

    });


    function calculate(){
        var sleepInput = $('#sleepInput').val();
        var wishInput = $('#wishInput').val();
        
        var thisTimeZone = moment.tz.guess(true);
        var userSleepTime = moment.tz(sleepInput, "hh:mma", thisTimeZone);
        var wishInputTime = moment.tz(wishInput, "hh:mma", thisTimeZone);
        if(userSleepTime.isValid() && wishInputTime.isValid()){
            var found = false;
            var i;
            var markers = [];
            
            for(i = 0; i < moment.tz.names().length; i++){        
                var tzName = moment.tz.names()[i];
                var compareTime = moment.tz(userSleepTime, tzName);        
                if(compareTime.format("hha") == wishInputTime.format("hha")){
                    if(coords[tzName] != null){
                        var tlong = coords[tzName].lon;
                        var tlat = coords[tzName].lat;
                        thisMark = {
                            coords:{lat:tlat,lng:tlong},
                            content:tzName
                        };
                        markers.push(thisMark);            
                        found = true;
                    }                        
                }
            }
            
            if(found){
                var str = "";
                for(i = 0; i < markers.length; i++){
                    //FORMAT STRING SO America/Los_Angeles turns into Los Angeles etc...
                    var temp = markers[i].content;
                    var slashPos = temp.lastIndexOf('/');
                    if(slashPos > -1){
                        temp = temp.substring(slashPos+1).replace(/_/g, " ");
                        str+=temp+"<br>";
                    }
                }
                $("#locations").show(); 

                document.getElementById('locations').innerHTML = str;
                
                initMapWithMarkers(markers);
                
                $("#map").show();
        
                
            } else {
                $("#result").hide();
                $("#locations").hide(); 
                $("#map").hide();
                swal({
                    title: "Sorry!",
                    text: "It looks like we couldn't find any valid locations that fit your sleep schedule!",
                    icon: "error"
                });  
            }

            $("#result").show();
            
            setTimeout(function(){

                document.getElementById('result').scrollIntoView({ 
                    behavior: 'smooth' 
                });
            }, 100);
        } 
        // else {
        //     swal({
        //         title: "Invalid Input!",
        //         text: "Looks like you did not fill in all the fields correctly!",
        //         icon: "error"
        //     });           
        // }
        
    }

    
});

