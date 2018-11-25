$(document).ready(function() {
    
    /*** INDEX ***/

    /* Clicks upload file button when the user clicks on the displayed button. */
    $("#gpx-upload").on("click", "#gpx-upload-btn", function() {
        $("#gpx-upload-file").click();
    });

    /* Event executed when files are uploaded by the user. */
    $("#gpx-upload-file").on("change", function() {
        
        /* Process gpx files uploaded by user. */
        var gpxFiles = processFiles($("#gpx-upload-file")[0]);
        
        /* Clear any previously uploaded files. */
        sessionStorage.clear();
        $("#gpx-files").empty();
        $("#gpx-generate-btn").addClass("d-none")

        /* Update html, and add gpx data to session storage */
        if (gpxFiles) {
            $("#gpx-files").append(
                "<div class='mt-2'> \
                <h4><strong>Selected Files</strong></h4> \
                </div>");  

            /* Provide feedback to user on the files they selected, 
             * and show button to generate visualisation of GPX. */
            for (gpxFile of gpxFiles) {
                $("#gpx-files").append(gpxFile.name + " <br />");
                /*  */
                gpxFileParse(gpxFile);           
            }
            $("#gpx-files").removeClass("d-none");
            $("#gpx-generate-btn").removeClass("d-none");
            $("#gpx-upload-btn").removeClass("btn-lg");
        }
    });

    /*** GPX VISUALISER ***/
    $("#gpx-console-view").on("click", function() {
        for (var i=0; i < sessionStorage.length ; i++) {            
            console.log(sessionStorage.getItem(sessionStorage.key(i)));
        }
    })

});


/* Process files uploaded by user -
 * Checks the quantity is within range and the files are of the correct type.
 * Returns a list of the files if they are acceptable; otherwise, clears the filelist. 
 */
function processFiles(docObj) {

    var uploadedFiles = docObj.files;
    var fileLimit = $(docObj).attr('fileLimit');
    
    /* Check user's uploaded file quantity is within the acceptable range. */
    if (uploadedFiles.length > fileLimit) {
        uploadedFiles = '';
        alert("Too many files selected. Please limit the number of files to " + fileLimit + ".");
        return uploadedFiles;
    }

    /* Check user's uploaded files are the correct type. */
    for (i=0; i<uploadedFiles.length; i++) {
        if (!uploadedFiles[i].name.endsWith(".gpx")) {
            uploadedFiles = '';
            alert("The selected files are not compatible with HGV. Only gpx files are currently accepted.");
            return uploadedFiles;
        }
    }
    return uploadedFiles;
}

/* Parse GPX File and save to session storage. 
 *
 * Source: https://techglimpse.com/how-to-parse-xmlrss-and-store-in-html5-localstorage-using-jquery/ */

function gpxFileParse(gpxFile) {

    var readXml=null;

    var reader = new FileReader();
    reader.onload = function(e) {
        readXml=e.target.result;

        /* XML Parser */
        var parser = new DOMParser();
        var doc = parser.parseFromString(readXml, "application/xml");

        /* Create gpx object and save to session storage. */
        var gpxObj = gpxObjectCreate(doc);
        gpxName = doc.getElementsByTagName("name")[0].childNodes[0].nodeValue;
        gpxDate = doc.getElementsByTagName("metadata")[0].getElementsByTagName("time")[0].childNodes[0].nodeValue;
        sessionStorage.setItem(gpxName+" "+gpxDate, JSON.stringify(gpxObj));
    }
    reader.readAsText(gpxFile);
}

/* Creates a gpx object to store data from xml file. The gpxObject has the following form:
 *
 * {"name":
 *  "time":
 *  "type":
 *  "trksegs": [ [ {"lat": xxx, "lon": xxx, "ele": xxx, "time": xxx, 
 *                  "ext": {"hr": xxx, "cad": xxx} }, 
 *                  ... ],
 *               ... ], 
 *  }
 *
 * Source: https://techglimpse.com/how-to-parse-xmlrss-and-store-in-html5-localstorage-using-jquery/ */
function gpxObjectCreate(xmlDoc) {

    var gpxObject = new Object();
    gpxObject.name = xmlDoc.getElementsByTagName("name")[0].childNodes[0].nodeValue;
    gpxObject.time = xmlDoc.getElementsByTagName("metadata")[0].getElementsByTagName("time")[0].childNodes[0].nodeValue;

    if (xmlDoc.getElementsByTagName("type")[0]) {
        gpxObject.type = xmlDoc.getElementsByTagName("type")[0].childNodes[0].nodeValue;
    }

    /* Create an empty list for storing each track segment, each of which are a list of trackObjects. */
    gpxObject.trksegs = [];
    var tracksegments = xmlDoc.getElementsByTagName("trkseg");
    for (seg of tracksegments) {

        /* For each segment, add to the list a new trackObject, which stores all the relevant data. */
        var trkpts = [];
        var trackpoints = seg.getElementsByTagName("trkpt");
        for (track of trackpoints) {
            var trackObject = new Object();
            
            trackObject.lat = track.getAttribute("lat");
            trackObject.lon = track.getAttribute("lon");
            trackObject.ele = track.getElementsByTagName("ele")[0].childNodes[0].nodeValue;
            trackObject.time = track.getElementsByTagName("time")[0].childNodes[0].nodeValue;

            /* Add extensions if they are included in the gpx file. */
            if (track.getElementsByTagName("extensions")[0]) {
                var extensions = track.getElementsByTagName("extensions")[0];
                var trackExts = new Object();
                if (extensions.getElementsByTagNameNS("*", "hr")[0]) {
                    trackExts.hr = extensions.getElementsByTagNameNS("*", "hr")[0].childNodes[0].nodeValue;
                }
                if (extensions.getElementsByTagNameNS("*", "cad")[0]) {
                    trackExts.cad = extensions.getElementsByTagNameNS("*", "cad")[0].childNodes[0].nodeValue;
                }
                /** ADD OTHER EXTENSIONS HERE USING THE SAME FORMAT **/

                if (extensions.getElementsByTagNameNS("*", "atemp")[0]) {
                    trackExts.atemp = extensions.getElementsByTagNameNS("*", "atemp")[0].childNodes[0].nodeValue;
                }
                trackObject.ext = trackExts;
            }
            trkpts.push(trackObject);
        }       
        gpxObject.trksegs.push(trkpts);
    }
    
    return gpxObject;
}

