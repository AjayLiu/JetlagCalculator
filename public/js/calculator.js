$( document ).ready(function() {
    // $.ajax({
    //     url: 'https://reverse.geocoder.ls.hereapi.com/6.2/reversegeocode.json',
    //     type: 'GET',
    //     dataType: 'jsonp',
    //     jsonp: 'jsoncallback',
    //     data: {
    //       prox: '41.8842,-87.6388,250',
    //       mode: 'retrieveAddresses',
    //       maxresults: '1',
    //       gen: '9',
    //       apiKey: '91LVIt9DhnPsvteyvqZUgtMkdQekklz5SHZmMj9RLIU'
    //     },
    //     success: function (data) {
    //       alert(data["Response"]["View"][0]["Result"][0]["Location"]["Address"]["Country"]);
    //     }
    // });

    var geocoder = require('local-reverse-geocoder');

    // With just one point
    var point = {latitude: 42.083333, longitude: 3.1};
    geocoder.lookUp(point, function(err, res) {
        console.log(JSON.stringify(res, null, 2));
    });

    AirportInput("autocomplete-airport-1");
    AirportInput("autocomplete-airport-2");

    $('#sleepInput').timepicker({
        'minTime': '10:00pm',
        'maxTime': '9:30pm',
    });

    $(".result").hide();

    $( "#calculateButton" ).click(function() {
        calculate();
    });

    var inverse = false;
    $( "#invertButton" ).click(function() {
        inverse = !inverse;
        calculate(); 
    });

    function checkInputData(id) {
        var realId = "autocomplete-airport-" + id;
        return ([document.getElementById(realId).getAttribute("data-lat"), document.getElementById(realId).getAttribute(
            "data-lon"), document.getElementById(realId).getAttribute("data-tz"), document.getElementById(realId).getAttribute("data-iata")]);
    }

    function calculate(){
        var sleepInput = $('#sleepInput').val();
        
        var userSleepTime = moment.tz(sleepInput, "hh:mma", tzlookup(checkInputData(2)[0], checkInputData(2)[1]));
        var airportMoment = userSleepTime.clone().tz(tzlookup(checkInputData(1)[0], checkInputData(1)[1]));
        if(userSleepTime.isValid() && airportMoment.isValid()){
            var depName = checkInputData(1)[3];
            var destName = checkInputData(2)[3];
            if(!inverse){
                document.getElementById("resultTitle").innerHTML = userSleepTime.format("hh:mma") + " at " + destName + " is " + airportMoment.format("hh:mma") + " at " + depName;            
            } else {
                userSleepTime = moment.tz(sleepInput, "hh:mma", tzlookup(checkInputData(1)[0], checkInputData(1)[1]));
                airportMoment = userSleepTime.clone().tz(tzlookup(checkInputData(2)[0], checkInputData(2)[1]));
                document.getElementById("resultTitle").innerHTML = userSleepTime.format("hh:mma") + " at " + depName + " is " + airportMoment.format("hh:mma") + " at " + destName;  
            } 
            
            $(".result").show();
                            
            document.querySelector('.result').scrollIntoView({ 
                behavior: 'smooth' 
            }); 
        } else {
            swal({
                title: "Invalid Input!",
                text: "Looks like you did not fill in all the fields correctly!",
                icon: "error"
            });   
        }
    }

});

