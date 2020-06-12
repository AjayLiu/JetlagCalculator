$("#result").hide();
$( document ).ready(function() {

    $('#countdownInput').combodate({
        format:"MMM-D-YYYY hh:mma",
        value: moment().format("MMM-D-YYYY hh:mma"),
        minYear: 0,
        maxYear: 3000,
        yearDescending: false,
        minuteStep: 10
    }); 
    $('#calculateCountdown').click(function() {
        str = $('#countdownInput').combodate('getValue');
        countdownMoment = moment(str, "MMM-D-YYYY hh:mma");
        
        countdownTick();
        // Update the count down every 1 second
        var x = setInterval(function() {
            countdownTick();
        }, 1000);
        
        function countdownTick(){
            document.getElementById("resultTitle").innerHTML = countdownMoment.countdown().toString() + (countdownMoment.isBefore(moment()) ? " ago." : " remaining.");        
        }

        $("#result").show();
            
        document.getElementById('result').scrollIntoView({ 
            behavior: 'smooth' 
        });
            

    });
});
