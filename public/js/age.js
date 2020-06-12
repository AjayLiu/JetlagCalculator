$( document ).ready(function() {

    $('#birthdayInput').combodate({
        format:"MMM-D-YYYY",
        value: moment().format("MMM-D-YYYY"),
        minYear: 0,
        maxYear: 3000,
        yearDescending: false,
    }); 
    $('#whenInput').combodate({
        format:"MMM-D-YYYY",
        value: moment().format("MMM-D-YYYY"),
        minYear: 0,
        maxYear: 3000,
        yearDescending: false,
    }); 
    $('#calculateAge').click(function() {
        bdayInput = $('#birthdayInput').combodate('getValue');
        whenInput = $('#whenInput').combodate('getValue');

        birthdayMoment = moment(bdayInput, "MMM-D-YYYY");
        whenMoment = moment(whenInput, "MMM-D-YYYY");
        if(birthdayMoment.isBefore(whenMoment)){
            document.getElementById('result').innerText = "On " + whenMoment.format("MMMM DD, YYYY") + ", this person will be " + whenMoment.diff(birthdayMoment, "years") + " years old!";
        } else {
            swal("Invalid input!", "The requested date is earlier than the date of birth!", "error");
        }


        $("#result").show();
            
        document.getElementById('result').scrollIntoView({ 
            behavior: 'smooth' 
        });
    });
});
