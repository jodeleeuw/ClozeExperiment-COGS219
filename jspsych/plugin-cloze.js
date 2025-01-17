var jsPsychCloze = (function (jspsych) {
  "use strict";

  const info = {
    name: "cloze",
    parameters: {
      /** The cloze text to be displayed. Blanks are indicated by %% signs and automatically replaced by input fields. If there is a correct answer you want the system to check against, it must be typed between the two percentage signs (i.e. %solution%). */
      text: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: "Cloze text",
        default: undefined,
      },
      /** Text of the button participants have to press for finishing the cloze test. */
      button_text: {
        type: jspsych.ParameterType.STRING,
        pretty_name: "Button text",
        default: "OK",
      },
      /** Boolean value indicating if the answers given by participants should be compared against a correct solution given in the text (between % signs) after the button was clicked. */
      check_answers: {
        type: jspsych.ParameterType.BOOL,
        pretty_name: "Check answers",
        default: false,
      },
      /** Function called if check_answers is set to TRUE and there is a difference between the participants answers and the correct solution provided in the text. */
      mistake_fn: {
        type: jspsych.ParameterType.FUNCTION,
        pretty_name: "Mistake function",
        default: () => {},
      },
    },
  };
  /**
   * **cloze**
   *
   * jsPsych plugin for displaying a cloze test and checking participants answers against a correct solution
   *
   * @author Philipp Sprengholz
   * @see {@link https://www.jspsych.org/plugins/jspsych-cloze/ cloze plugin documentation on jspsych.org}
   */
  class ClozePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {
      var html = '<div class="cloze">';
      var elements = trial.text.split("%");
      const solutions = this.getSolutions(trial.text);
      let solution_counter = 0;
      for (var i = 0; i < elements.length; i++) {
        if (i % 2 === 0) {
          html += elements[i];
        } else {
          html += `<input type="text" id="input${solution_counter}" value="">`;
          solution_counter++;
        }
      }
      html += "</div>";
      display_element.innerHTML = html;

      const check = () => {
        var answers = [];
        var answers_correct = true;
        for (var i = 0; i < solutions.length; i++) {
          var field = document.getElementById("input" + i);
          answers.push(field.value.trim());
          if (trial.check_answers) {
            if (answers[i] !== solutions[i]) {
              field.style.color = "red";
              answers_correct = false;
            } else {
              field.style.color = "black";
            }
          }
        }
        if (!trial.check_answers || (trial.check_answers && answers_correct)) {
          var trial_data = {
            response: answers,
          };
          display_element.innerHTML = "";
          this.jsPsych.finishTrial(trial_data);
        } else {
          trial.mistake_fn();
        }
      };
      display_element.innerHTML +=
        '<br><button class="jspsych-html-button-response-button jspsych-btn" type="button" id="finish_cloze_button">' +
        trial.button_text +
        "</button>";
      display_element
        .querySelector("#finish_cloze_button")
        .addEventListener("click", check);

      this.jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: check,
        valid_responses: ["Enter"],
        persist: false,
      });
    }
    getSolutions(text) {
      const solutions = [];
      const elements = text.split("%");
      for (let i = 0; i < elements.length; i++) {
        if (i % 2 == 1) {
          solutions.push(elements[i].trim());
        }
      }
      return solutions;
    }
    simulate(trial, simulation_mode, simulation_options, load_callback) {
      if (simulation_mode == "data-only") {
        load_callback();
        this.simulate_data_only(trial, simulation_options);
      }
      if (simulation_mode == "visual") {
        this.simulate_visual(trial, simulation_options, load_callback);
      }
    }
    create_simulation_data(trial, simulation_options) {
      const solutions = this.getSolutions(trial.text);
      const responses = [];
      for (const word of solutions) {
        if (word == "") {
          responses.push(
            this.jsPsych.randomization.randomWords({ exactly: 1 })
          );
        } else {
          responses.push(word);
        }
      }
      const default_data = {
        response: responses,
      };
      const data = this.jsPsych.pluginAPI.mergeSimulationData(
        default_data,
        simulation_options
      );
      //this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
      return data;
    }
    simulate_data_only(trial, simulation_options) {
      const data = this.create_simulation_data(trial, simulation_options);
      this.jsPsych.finishTrial(data);
    }
    simulate_visual(trial, simulation_options, load_callback) {
      const data = this.create_simulation_data(trial, simulation_options);
      const display_element = this.jsPsych.getDisplayElement();
      this.trial(display_element, trial);
      load_callback();
      const inputs = display_element.querySelectorAll('input[type="text"]');
      let rt = this.jsPsych.randomization.sampleExGaussian(
        750,
        200,
        0.01,
        true
      );
      for (let i = 0; i < data.response.length; i++) {
        this.jsPsych.pluginAPI.fillTextInput(inputs[i], data.response[i], rt);
        rt += this.jsPsych.randomization.sampleExGaussian(750, 200, 0.01, true);
      }
      this.jsPsych.pluginAPI.clickTarget(
        display_element.querySelector("#finish_cloze_button"),
        rt
      );
    }
  }
  ClozePlugin.info = info;

  return ClozePlugin;
})(jsPsychModule);
