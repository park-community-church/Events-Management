/*
 * This script will grab data from the Google Sheet specified by SPREADSHEET_ID from
 * row 5 downward, columns A to G inclusive
 * The data comes in array form, where index:
 *     0 is the title
 *     1 is the location string
 *     2 is the time string
 *     3 is the programmatic date
 *     4 is the description string, HTML allowed
 *     5 is the programmatic category
 *     6 is the programmatic campus display codes
 * If the programmatic date is missing or malformed, the event will live forever
 */
var PAGE_LOCATIONS = ['NN'];
var CLIENT_ID = '437012055118-4p7jcp17r63pos5ue7d3ethn5ee2b34c.apps.googleusercontent.com';
var API_KEY = 'AIzaSyDTI0-tzVyFySgu8fxBfHz9bwkqi3P91Ks';
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var SPREADSHEET_ID = '1yzYNtbLuqIH0oC4WmP6eL03vh5WIWu9BhMFdiW_zUmU';
var FETCH_RANGE = 'Events!A5:G';
var MILLISECONDS_IN_A_DAY = 86400000;

/*
 * 0 is the name of the tab
 * 1 is the HTML content of events
 */
var eventsTabHtmlTemplate = '<div class="park-tab">' +
    '<input class="park-accordion-input" id="tab-{0}" type="checkbox" name="tabs">' +
    '<label class="park-accordion-label" for="tab-{0}">{0}</label><div class="park-tab-content">' +
    '{1}' +
    '</div></div>';

/*
 * 0 is the title of the event
 * 1 is the time of the event
 * 2 is the location of the event
 * 3 is the description of the event
 */
var eventContentHtmlTemplate = '<p><b>{0}</b><br>' +
    '<i class="fa fa-clock-o" aria-hidden="true"></i>&nbsp;&nbsp;{1}<br>' +
    '<i class="fa fa-map-marker" aria-hidden="true"></i>&nbsp;&nbsp;{2}<br>' +
    '{3}';


/*
 * DO NOT EDIT ANYTHING BELOW THIS LINE UNLESS YOU KNOW WHAT YOU'RE DOING
 */
// Taken from https://stackoverflow.com/a/4673436/1539628
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

function loadEvents() {
    gapi.load('client', function(){
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function() {
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: FETCH_RANGE
            }).then(function(response) {
                var events = response.result.values;
                var eventsByCategory = {};

                // Bin events array into categories
                $.each(events, function(i, event) {
                    var eventCategory = event[5];
                    var eventDate = event[3];

                    // Add event location codes to a Set() object
                    var eventLocations = new Set();
                    $.each(event[6].split(','), function(i, locationCode) {
                        eventLocations.add(locationCode);
                    });

                    // Filter out expired events
                    // TODO This is a good candidate for a isEventExpired() function
                    if (Date.now() > Date.parse(eventDate) + MILLISECONDS_IN_A_DAY) return true;

                    // Filter out events that aren't at this location
                    if (PAGE_LOCATIONS.filter(function(x){return eventLocations.has(x)}).length === 0
                        && !eventLocations.has('ALL')) return true;

                    // If this is the first event in the category, add an entry for it
                    if (eventsByCategory[eventCategory] === undefined) {
                        eventsByCategory[eventCategory] = [];
                    }

                    // Push event onto category Array
                    eventsByCategory[eventCategory].push(event);
                });

                // Iterate through each category
                var eventsHtml = '';
                $.each(eventsByCategory, function (category, eventData) {
                    var categoryHtml = '';
                    $.each(eventData, function(i, event) {
                        var title = event[0],
                            location = event[1],
                            time = event[2],
                            description = event[4];
                        categoryHtml += eventContentHtmlTemplate.format(title, time, location, description);
                    });
                    eventsHtml += eventsTabHtmlTemplate.format(category.toUpperCase(), categoryHtml);
                });
                $('#park-events').append($(eventsHtml));
            });
        });
    });
}
