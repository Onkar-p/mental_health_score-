
(() => {

    "use strict";


    /* =========================
       ELEMENTS
    ========================= */

    const $ = (id) =>
        document.getElementById(id);


    const form =
        $("predict-form");


    const submitBtn =
        $("submit-btn");


    const states = {

        idle:
            $("state-idle"),

        loading:
            $("state-loading"),

        result:
            $("state-result"),

        error:
            $("state-error")

    };


    /* =========================
       MODEL INPUT FIELDS
    ========================= */

    const NUMBER_FIELDS = {

        age:
            [10, 100, true],

        avg_daily_usage_hours:
            [0, 24, false],

        daily_unlocks:
            [0, Infinity, true],

        study_hours:
            [0, 24, false],

        physical_activity_hours:
            [0, 24, false],

        sleep_hours_per_night:
            [0, 24, false]

    };


    const REQUIRED_TEXT = [

        "gender",

        "country",

        "academic_level",

        "most_used_platform",

        "purpose_of_use"

    ];


    /* =========================
       SHOW STATE
    ========================= */

    function showState(name) {

        Object.entries(states)
            .forEach(([key, element]) => {

                element.hidden =
                    key !== name;

            });


        if (name === "result") {

            $("state-result").animate(

                [
                    {
                        opacity: 0,
                        transform:
                            "translateY(15px)"
                    },

                    {
                        opacity: 1,
                        transform:
                            "translateY(0)"
                    }
                ],

                {
                    duration: 500,
                    easing:
                        "cubic-bezier(.22,1,.36,1)"
                }

            );

        }

    }


    /* =========================
       FIELD HELPERS
    ========================= */

    function fieldOf(name) {

        const element =
            form.elements[name];


        const node =
            element &&
            element.length !== undefined &&
            !element.tagName
                ? element[0]
                : element;


        return node
            ? node.closest(".field")
            : null;

    }


    function setError(name, message) {

        const field =
            fieldOf(name);


        if (!field)
            return;


        field.classList.add(
            "invalid"
        );


        const error =
            field.querySelector(
                ".error"
            );


        if (error)
            error.textContent =
                message;

    }


    function clearErrors() {

        form
            .querySelectorAll(
                ".field.invalid"
            )
            .forEach(field => {

                field.classList.remove(
                    "invalid"
                );

            });

    }


    /* =========================
       PROGRESS BAR
    ========================= */

    function updateProgress() {

        const controls =
            [
                ...form.querySelectorAll(
                    "input, select"
                )
            ]
            .filter(
                element =>
                    element.name
            );


        const names =
            [
                ...new Set(
                    controls.map(
                        element =>
                            element.name
                    )
                )
            ];


        let completed = 0;


        names.forEach(name => {

            const group =
                form.querySelectorAll(
                    `[name="${name}"]`
                );


            const isRadio =
                [...group].some(
                    element =>
                        element.type ===
                        "radio"
                );


            if (isRadio) {

                if (
                    [...group].some(
                        element =>
                            element.checked
                    )
                ) {

                    completed++;

                }

            }

            else {

                const element =
                    form.elements[name];


                if (
                    element &&
                    String(
                        element.value || ""
                    ).trim()
                ) {

                    completed++;

                }

            }

        });


        const percentage =
            Math.round(
                (completed /
                    names.length) *
                100
            );


        $("progress-fill")
            .style.width =
            percentage + "%";


        $("progress-text")
            .textContent =
            percentage +
            "% complete";

    }


    /* =========================
       COLLECT FORM DATA
    ========================= */

    function collect() {

        const formData =
            new FormData(form);


        const payload = {};


        for (
            const [
                name,
                [, , isInteger]
            ]
            of Object.entries(
                NUMBER_FIELDS
            )
        ) {

            const raw =
                String(
                    formData.get(name)
                    ?? ""
                ).trim();


            payload[name] =
                raw === ""
                    ? null
                    : isInteger
                        ? parseInt(
                            raw,
                            10
                        )
                        : parseFloat(
                            raw
                        );

        }


        REQUIRED_TEXT.forEach(
            name => {

                payload[name] =
                    String(
                        formData.get(
                            name
                        ) ?? ""
                    ).trim();

            }
        );


        payload.stress_level =
            formData.get(
                "stress_level"
            ) || "";


        return payload;

    }


    /* =========================
       VALIDATION
    ========================= */

    function validate(payload) {

        const errors = {};


        for (
            const [
                name,
                [min, max]
            ]
            of Object.entries(
                NUMBER_FIELDS
            )
        ) {

            const value =
                payload[name];


            if (
                value === null ||
                Number.isNaN(value)
            ) {

                errors[name] =
                    "Enter a number.";

            }

            else if (
                value < min ||
                value > max
            ) {

                errors[name] =
                    max === Infinity
                        ? `Must be ${min} or more.`
                        : `Must be between ${min} and ${max}.`;

            }

        }


        REQUIRED_TEXT.forEach(
            name => {

                if (!payload[name]) {

                    errors[name] =
                        "This field is required.";

                }

            }
        );


        if (!payload.stress_level) {

            errors.stress_level =
                "Choose a stress level.";

        }


        return errors;

    }


    /* =========================
       SCORE CATEGORY
    ========================= */

    function getBand(score) {

        if (score < 4) {

            return [

                "Low Score",

                "low",

                "Your current routine may have areas that could use more support. Consider small and realistic changes to sleep, activity and screen habits."

            ];

        }


        if (score < 7) {

            return [

                "Moderate Score",

                "mid",

                "Your routine looks fairly balanced, with some room for healthier habits and better recovery."

            ];

        }


        return [

            "Healthy Score",

            "high",

            "Your answers suggest a well-supported routine. Keep protecting the habits that help you feel balanced."

        ];

    }


    /* =========================
       SHOW RESULT
    ========================= */

    function showResult(score) {

        const clamped =
            Math.max(
                0,
                Math.min(
                    10,
                    score
                )
            );


        const [

            label,

            cssClass,

            message

        ] =
            getBand(clamped);


        $("score-number")
            .textContent =
            score.toFixed(1);


        const band =
            $("score-band");


        band.textContent =
            label;


        band.className =
            "score-band " +
            cssClass;


        $("score-context")
            .textContent =
            message;


        const percentage =
            clamped * 10;


        const meter =
            $("meter-fill");


        const circle =
            $("score-progress");


        meter.style.width =
            "0%";


        circle.style.strokeDashoffset =
            "314";


        $("circle-value")
            .textContent =
            "0%";


        showState("result");


        requestAnimationFrame(
            () => {

                requestAnimationFrame(
                    () => {

                        meter.style.width =
                            percentage +
                            "%";


                        const circumference =
                            314;


                        circle.style.strokeDashoffset =
                            circumference -
                            (
                                circumference *
                                percentage /
                                100
                            );


                        animatePercentage(
                            percentage
                        );

                    }
                );

            }
        );

    }


    /* =========================
       ANIMATE PERCENTAGE
    ========================= */

    function animatePercentage(
        target
    ) {

        const element =
            $("circle-value");


        const duration =
            1000;


        const startTime =
            performance.now();


        function update(
            currentTime
        ) {

            const progress =
                Math.min(
                    1,
                    (
                        currentTime -
                        startTime
                    ) /
                    duration
                );


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            const value =
                Math.round(
                    target *
                    eased
                );


            element.textContent =
                value +
                "%";


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    update
                );

            }

        }


        requestAnimationFrame(
            update
        );

    }


    /* =========================
       SHOW ERROR
    ========================= */

    function showError(
        title,
        message
    ) {

        $("error-title")
            .textContent =
            title;


        $("error-copy")
            .textContent =
            message;


        showState(
            "error"
        );

    }


    /* =========================
       INPUT ANIMATION
    ========================= */

    form.addEventListener(
        "input",
        event => {

            const field =
                event.target.closest(
                    ".field"
                );


            if (field) {

                field.classList.remove(
                    "invalid"
                );

            }


            updateProgress();

        }
    );


    form.addEventListener(
        "change",
        updateProgress
    );


    /* =========================
       SUBMIT
    ========================= */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            clearErrors();


            const payload =
                collect();


            const errors =
                validate(
                    payload
                );


            const errorNames =
                Object.keys(
                    errors
                );


            if (
                errorNames.length
            ) {

                errorNames.forEach(
                    name => {

                        setError(
                            name,
                            errors[name]
                        );

                    }
                );


                const first =
                    form.elements[
                        errorNames[0]
                    ];


                (
                    first.focus
                        ? first
                        : first[0]
                )?.focus();


                return;

            }


            /* Loading */

            submitBtn.disabled =
                true;


            submitBtn.classList.add(
                "loading"
            );


            showState(
                "loading"
            );


            try {

                const response =
                    await fetch(
                        "/predict",
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    payload
                                )

                        }
                    );


                const body =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                /* Validation error */

                if (
                    response.status ===
                    422
                ) {

                    Object.entries(
                        body.errors || {}
                    ).forEach(
                        ([name, message]) => {

                            setError(
                                name,
                                message
                            );

                        }
                    );


                    showError(
                        "Check your answers",
                        "Some fields were not accepted. They are marked in the form."
                    );


                    return;

                }


                /* Server error */

                if (
                    !response.ok
                ) {

                    showError(
                        "Could not get a score",
                        body.error ||
                        `The server returned status ${response.status}.`
                    );


                    return;

                }


                /* Score missing */

                if (
                    typeof
                    body.predicted_mental_health_score
                    !==
                    "number"
                ) {

                    showError(
                        "Unexpected response",
                        "The server did not return a score. Try again."
                    );


                    return;

                }


                /* SUCCESS */

                showResult(
                    body.predicted_mental_health_score
                );

            }

            catch (error) {

                console.error(
                    error
                );


                showError(
                    "Cannot reach the server",
                    "Check that the Flask app is running, then try again."
                );

            }

            finally {

                submitBtn.disabled =
                    false;


                submitBtn.classList.remove(
                    "loading"
                );

            }

        }
    );


    /* =========================
       RESET
    ========================= */

    $("reset-btn")
        .addEventListener(
            "click",
            () => {

                form.reset();

                clearErrors();

                updateProgress();

                showState(
                    "idle"
                );


                window.scrollTo({

                    top: 0,

                    behavior:
                        "smooth"

                });

            }
        );


    $("error-btn")
        .addEventListener(
            "click",
            () => {

                showState(
                    "idle"
                );


                form.scrollIntoView({

                    behavior:
                        "smooth",

                    block:
                        "start"

                });

            }
        );


    /* =========================
       INITIALIZE
    ========================= */

    updateProgress();

})();

