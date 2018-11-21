$(document).ready(function() {

        
        var gpxFile = JSON.parse(sessionStorage.getItem(sessionStorage.key(id)));

        console.log("graph")
        var data = []
        var earliesttime = 0
        var type = "Heart Rate"
        var unit = "BPM ( Beats Per Minute )"
        // var type = "Temperature"
        // var unit = "Degree ( Celsius )"

        for (seg of gpxFile.trksegs){
            
            for(var i =0 ;i<seg.length ; i++){
                var time = seg[i].time;

                if(earliesttime == 0){
                    earliesttime = time
                }

                if(type == "Temperature"  && seg[i].ext.atemp){
                    var atemp = seg[i].ext.atemp
                    data.push({x : (toDate(time).getTime() - toDate(earliesttime).getTime()) / (3600 * 60), y : parseInt(atemp)})
                    
                } else if (type == "Heart Rate" && seg[i].ext.hr){
                    var hr = seg[i].ext.hr
                    data.push({x : (toDate(time).getTime() - toDate(earliesttime).getTime()) / (3600 * 60), y : parseInt(hr)})
                }
            }
        }
        console.log(type)

        var chart = new CanvasJS.Chart('chartContainer', {
            animationEnabled: true,
            theme: "light2",
            title:{
                text: type + " from " + gpxFile.name
            },
            axisX:{
                title : "Time (hr)",
                crosshair: {
                    enabled: true,
                    snapToDataPoint: true
                }
            },
            axisY: {
                title: unit,
                crosshair: {
                    enabled: true
                }
            },
            toolTip:{
                shared:true
            },  
            legend:{
                cursor:"pointer",
                verticalAlign: "bottom",
                horizontalAlign: "left",
                dockInsidePlotArea: true,
                itemclick: toogleDataSeries
            },
            data: [{
                type: "line",
                showInLegend: true,
                name: type,
                markerType: "square",
                color: "#F08080",
                dataPoints : data
            }]
        });
        chart.render();

    
    function toogleDataSeries(e){
        if (typeof(e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        } else{
            e.dataSeries.visible = true;
        }
        chart.render();
    }


    function toDate(time){
        var result = new Date();
       
        result.setFullYear(time.substring(0,4));
        result.setMonth(time.substring(5,7));
        result.setDate(time.substring(8,10));
        result.setHours(time.substring(11,13));
        result.setMinutes(time.substring(14,16));
        result.setSeconds(time.substring(17,19));

        // console.log(result);
        return result;
    }
    
});
