/** In this code, I make the following changes to the original jsPsych plugin: */
    /** add ability to track slider history as a parameter */
    /** remove button so that video is shown with slider only */

var jsPsychVideoSliderResponse = (function (jspsych) {
    'use strict';

    const info = {
        name: "video-slider-response",
        parameters: {
            /** Array of the video file(s) to play. Video can be provided in multiple file formats for better cross-browser support. */
            stimulus: {
                type: jspsych.ParameterType.VIDEO,
                pretty_name: "Video",
                default: undefined,
                array: true,
            },
            /** Any content here will be displayed below the stimulus. */
            prompt: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Prompt",
                default: null,
            },
            /** The width of the video in pixels. */
            width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Width",
                default: "",
            },
            /** The height of the video display in pixels. */
            height: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Height",
                default: "",
            },
            /** If true, the video will begin playing as soon as it has loaded. */
            autoplay: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Autoplay",
                default: true,
            },
            /** If true, the subject will be able to pause the video or move the playback to any point in the video. */
            controls: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Controls",
                default: false,
            },
            /** Time to start the clip. If null (default), video will start at the beginning of the file. */
            start: {
                type: jspsych.ParameterType.FLOAT,
                pretty_name: "Start",
                default: null,
            },
            /** Time to stop the clip. If null (default), video will stop at the end of the file. */
            stop: {
                type: jspsych.ParameterType.FLOAT,
                pretty_name: "Stop",
                default: null,
            },
            /** The playback rate of the video. 1 is normal, <1 is slower, >1 is faster. */
            rate: {
                type: jspsych.ParameterType.FLOAT,
                pretty_name: "Rate",
                default: 1,
            },
            /** Sets the minimum value of the slider. */
            min: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Min slider",
                default: 0,
            },
            /** Sets the maximum value of the slider. */
            max: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Max slider",
                default: 100,
            },
            /** Sets the starting value of the slider. */
            slider_start: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Slider starting value",
                default: 50,
            },
            /** Sets the step of the slider. */
            step: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Step",
                default: 1,
            },
            /** Array containing the labels for the slider. Labels will be displayed at equidistant locations along the slider. */
            labels: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Labels",
                default: [],
                array: true,
            },
            /** Width of the slider in pixels. */
            slider_width: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Slider width",
                default: null,
            },
            /** If true, the participant will have to move the slider before continuing. */
            require_movement: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Require movement",
                default: false,
            },
            /** If true, the trial will end immediately after the video finishes playing. */
            trial_ends_after_video: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "End trial after video finishes",
                default: false,
            },
            /** How long to show trial before it ends. */
            trial_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Trial duration",
                default: null,
            },
            /** If true, the trial will end when subject makes a response. */
            response_ends_trial: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Response ends trial",
                default: true,
            },
            /** If true, then responses are allowed while the video is playing. If false, then the video must finish playing before a response is accepted. */
            response_allowed_while_playing: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Response allowed while playing",
                default: true,
            },
            /** If true, then all changes to the slider position will be recorded in an array. */
            track_slider_history: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Record the history of slider values",
                default: false
            },
        },
    };

    /**
     * **video-slider-response**
     *
     * jsPsych plugin for playing a video file and getting a slider response
     *
     * @author Josh de Leeuw
     * @see {@link https://www.jspsych.org/plugins/jspsych-video-slider-response/ video-slider-response plugin documentation on jspsych.org}
     */
    class VideoSliderResponsePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            if (!Array.isArray(trial.stimulus)) {
                throw new Error(`
          The stimulus property for the video-slider-response plugin must be an array
          of files. See https://www.jspsych.org/latest/plugins/video-slider-response/#parameters
        `);
            }
            // half of the thumb width value from jspsych.css, used to adjust the label positions
            var half_thumb_width = 7.5;
            // setup stimulus
            var video_html = '<video id="jspsych-video-slider-response-stimulus-video"';
            if (trial.width) {
                video_html += ' width="' + trial.width + '"';
            }
            if (trial.height) {
                video_html += ' height="' + trial.height + '"';
            }
            if (trial.autoplay && trial.start == null) {
                // if autoplay is true and the start time is specified, then the video will start automatically
                // via the play() method, rather than the autoplay attribute, to prevent showing the first frame
                video_html += " autoplay ";
            }
            if (trial.controls) {
                video_html += " controls ";
            }
            if (trial.start !== null) {
                // hide video element when page loads if the start time is specified,
                // to prevent the video element from showing the first frame
                video_html += ' style="visibility: hidden;"';
            }
            video_html += ">";
            var video_preload_blob = this.jsPsych.pluginAPI.getVideoBuffer(trial.stimulus[0]);
            if (!video_preload_blob) {
                for (var i = 0; i < trial.stimulus.length; i++) {
                    var file_name = trial.stimulus[i];
                    if (file_name.indexOf("?") > -1) {
                        file_name = file_name.substring(0, file_name.indexOf("?"));
                    }
                    var type = file_name.substr(file_name.lastIndexOf(".") + 1);
                    type = type.toLowerCase();
                    if (type == "mov") {
                        console.warn("Warning: video-slider-response plugin does not reliably support .mov files.");
                    }
                    video_html += '<source src="' + file_name + '" type="video/' + type + '">';
                }
            }
            video_html += "</video>";
            var html = '<div id="jspsych-video-slider-response-wrapper" style="margin: 0px 0px;">';  // Set top margin to 0
            html += '<div id="jspsych-video-slider-response-stimulus">' + video_html + "</div>";
            html +=
                '<div class="jspsych-video-slider-response-container" style="position:relative; margin: 0 auto 3em auto; width:';
            if (trial.slider_width !== null) {
                html += trial.slider_width + "px;";
            }
            else {
                html += "auto;";
            }
            html += '">';
            html +=
                '<input type="range" class="jspsych-slider" value="' +
                    trial.slider_start +
                    '" min="' +
                    trial.min +
                    '" max="' +
                    trial.max +
                    '" step="' +
                    trial.step +
                    '" id="jspsych-video-slider-response-response"';
            if (!trial.response_allowed_while_playing) {
                html += " disabled";
            }
            html += "></input><div>";
            for (var j = 0; j < trial.labels.length; j++) {
                var label_width_perc = 100 / (trial.labels.length - 1);
                var percent_of_range = j * (100 / (trial.labels.length - 1));
                var percent_dist_from_center = ((percent_of_range - 50) / 50) * 100;
                var offset = (percent_dist_from_center * half_thumb_width) / 100;
                html +=
                    '<div style="border: 1px solid transparent; display: inline-block; position: absolute; ' +
                        "left:calc(" +
                        percent_of_range +
                        "% - (" +
                        label_width_perc +
                        "% / 2) - " +
                        offset +
                        "px); text-align: center; width: " +
                        label_width_perc +
                        '%;">';
                html += '<span style="text-align: center; font-size: 80%;">' + trial.labels[j] + "</span>";
                html += "</div>";
            }
            html += "</div></div>";
            html += "</div>";
            if (trial.prompt !== null) {
                html += trial.prompt;
            }
            display_element.innerHTML = html;
            var video_element = display_element.querySelector("#jspsych-video-slider-response-stimulus-video");
            if (video_preload_blob) {
                video_element.src = video_preload_blob;
            }
            video_element.onended = () => {
                if (trial.trial_ends_after_video) {
                    end_trial();
                }
                else if (!trial.response_allowed_while_playing) {
                    enable_slider();
                }
            };
            video_element.playbackRate = trial.rate;
            if (trial.start !== null) {
                video_element.pause();
                video_element.currentTime = trial.start;
                video_element.onseeked = () => {
                    video_element.style.visibility = "visible";
                    if (trial.autoplay) {
                        video_element.play();
                    }
                    else {
                        video_element.pause();
                    }
                    video_element.onseeked = () => { };
                };
            }
            if (trial.stop !== null) {
                video_element.addEventListener("timeupdate", (e) => {
                    var currenttime = video_element.currentTime;
                    if (currenttime >= trial.stop) {
                        video_element.pause();
                        video_element.onseeked = () => { };
                    }
                });
            }
            display_element.querySelector("#jspsych-video-slider-response-response").addEventListener("change", () => {
                if (trial.require_movement) {
                    enable_slider();
                }
                if (trial.response_ends_trial) {
                    end_trial();
                }
            });

            function enable_slider() {
                display_element.querySelector("#jspsych-video-slider-response-response").disabled = false;
            }

            const startTime = performance.now();

            function end_trial() {
                jsPsych.pluginAPI.clearAllTimeouts();
                var endTime = performance.now();
                var response_time = endTime - startTime;
                var response = display_element.querySelector("#jspsych-video-slider-response-response").value;
                var trial_data = {
                    rt: response_time,
                    response: response,
                    stimulus: trial.stimulus,
                };
                display_element.innerHTML = "";
                jsPsych.finishTrial(trial_data);
            }

            if (trial.trial_duration !== null) {
                jsPsych.pluginAPI.setTimeout(() => {
                    end_trial();
                }, trial.trial_duration);
            }
        }
    }
    VideoSliderResponsePlugin.info = info;

    return VideoSliderResponsePlugin;
})(jsPsychModule);