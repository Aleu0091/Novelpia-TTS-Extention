let speed1 = localStorage.getItem("speed");
let speed = speed1 !== null ? speed1 : 1;

function observerContent() {
    let stopFlag = false;
    let paused = false;
    let rate = speed;
    let index = 0;
    let prev = null;
    let isHighlighting = false;

    const observer = new MutationObserver(async (mutations, obs) => {
        const lines = document.querySelectorAll(".line");
        if (lines.length > 0) {
            document.querySelectorAll(".loads").forEach(function (el) {
                el.style.display = "none";
            });
            obs.disconnect();
            await createLine(lines);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    async function createLine(lines) {
        const listenDiv = document.createElement("div");
        listenDiv.id = "listenDiv";
        Object.assign(listenDiv.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100vw",
            height: "100vh",
            backgroundColor: `rgba(0, 0, 0, 0)`,
            zIndex: "2",
        });
        document.body.appendChild(listenDiv);

        const epElement = document.querySelector(".menu-top-tag");
        const titleElement = document.querySelector(".menu-top-title");

        function getFirstVisibleLineIndex() {
            const lines = document.querySelectorAll(".line");
            for (let i = 0; i < lines.length; i++) {
                const rect = lines[i].getBoundingClientRect();
                if (rect.bottom > 0 && rect.top < window.innerHeight) {
                    return i;
                }
            }
            return 0;
        }
        index = getFirstVisibleLineIndex();

        // 상단 바
        const topBar = document.createElement("div");
        Object.assign(topBar.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "80px",
            background: "linear-gradient(to right, #8e2de2, #4a00e0)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 20px",
        });

        const ep = document.createElement("span");
        Object.assign(ep.style, {
            color: "white",
            fontSize: "16px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "60%",
            flexShrink: "1",
        });
        let epText = "";
        if (epElement) epText += epElement.innerText.trim() + " ";
        if (titleElement) epText += titleElement.innerText.trim();
        ep.textContent = epText || "제목 없음";

        const closeButton = document.createElement("button");
        closeButton.textContent = "close";
        closeButton.classList.add("material-symbols-outlined");
        Object.assign(closeButton.style, {
            fontSize: "24px",
            color: "white",
            background: "transparent",
            border: "none",
            cursor: "pointer",
        });

        topBar.appendChild(ep);
        topBar.appendChild(closeButton);
        listenDiv.appendChild(topBar);

        closeButton.addEventListener("click", () => {
            stopFlag = true;
            speechSynthesis.cancel();
            lines.forEach((line) => line.classList.remove("tts_line"));
            listenDiv.remove();
        });

        // 하단 바
        const bottomBar = document.createElement("div");
        Object.assign(bottomBar.style, {
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "100%",
            background: "linear-gradient(to right, #1f1f1f, #2a2a2a)",
            display: "flex",
            flexDirection: "column",
            padding: "12px 20px",
            boxShadow: "0 -4px 10px rgba(0, 0, 0, 0.4)",
            borderTop: "1px solid #444",
        });
        listenDiv.appendChild(bottomBar);

        const sliderRow = document.createElement("div");
        Object.assign(sliderRow.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
            gap: "50px",
        });

        const progressText = document.createElement("div");
        progressText.style.color = "#ccc";
        progressText.style.fontSize = "14px";
        progressText.textContent = `1 / ${lines.length}`;

        const rangeInput = document.createElement("input");
        Object.assign(rangeInput, {
            type: "range",
            min: 0,
            max: lines.length - 1,
            value: 0,
        });
        Object.assign(rangeInput.style, {
            cursor: "pointer",
            justifyContent: "center",
            flexGrow: "1",
        });

        sliderRow.appendChild(rangeInput);
        sliderRow.appendChild(progressText);
        bottomBar.appendChild(sliderRow);

        const controlRow = document.createElement("div");
        Object.assign(controlRow.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
        });

        const buttonGroup = document.createElement("div");
        Object.assign(buttonGroup.style, {
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexGrow: "1",
        });

        const createIconButton = (text) => {
            const btn = document.createElement("button");
            btn.innerHTML = text;
            Object.assign(btn.style, {
                fontSize: "20px",
                padding: "8px 12px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#3a3a3a",
                color: "white",
                cursor: "pointer",
                transition: "background-color 0.2s",
            });
            btn.classList.add("material-symbols-outlined");
            btn.addEventListener(
                "mouseover",
                () => (btn.style.backgroundColor = "#555")
            );
            btn.addEventListener(
                "mouseout",
                () => (btn.style.backgroundColor = "#3a3a3a")
            );
            return btn;
        };

        const pauseBtn = createIconButton("pause");
        const backBtn = createIconButton("skip_previous");
        const nextBtn = createIconButton("skip_next");

        buttonGroup.appendChild(backBtn);
        buttonGroup.appendChild(pauseBtn);
        buttonGroup.appendChild(nextBtn);
        controlRow.appendChild(buttonGroup);

        const speedSelect = document.createElement("select");
        for (let i = 0.6; i <= 3.2; i += 0.2) {
            const option = document.createElement("option");
            option.value = i.toFixed(1);
            option.textContent = i.toFixed(1) + "x";
            speedSelect.appendChild(option);
        }
        Object.assign(speedSelect.style, {
            marginLeft: "auto",
            padding: "8px 12px",
            fontSize: "14px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "#333",
            color: "#fff",
            cursor: "pointer",
        });
        speedSelect.value = rate;
        speedSelect.addEventListener("change", () => {
            rate = parseFloat(speedSelect.value);
            localStorage.setItem("speed", speedSelect.value);
        });

        controlRow.appendChild(speedSelect);
        bottomBar.appendChild(controlRow);

        listenDiv.addEventListener("click", (e) => {
            if (e.target !== listenDiv) return;
            bottomBar.style.display =
                bottomBar.style.display === "none" ? "flex" : "none";
            topBar.style.display =
                topBar.style.display === "none" ? "flex" : "none";
        });

        backBtn.addEventListener("click", () => {
            speechSynthesis.cancel();
            if (prev) prev.classList.remove("tts_line");
            const current = lines[index];
            if (current) current.classList.remove("tts_line");
            index = Math.max(0, index - 2);
            highlightNextLine();
        });

        nextBtn.addEventListener("click", () => {
            speechSynthesis.cancel();
            highlightNextLine();
        });

        pauseBtn.addEventListener("click", () => {
            paused = !paused;
            index = index - 1;
            pauseBtn.textContent = paused ? "play_arrow" : "pause";
            if (!paused) highlightNextLine();
            else speechSynthesis.cancel();
        });

        rangeInput.addEventListener("input", () => {
            index = parseInt(rangeInput.value);
            speechSynthesis.cancel();
            highlightNextLine();
        });

        async function highlightNextLine() {
            if (stopFlag || paused || isHighlighting) return;

            isHighlighting = true;
            let attempts = 0;

            while (lines[index]?.innerText.trim().length === 0) {
                index++;
                if (index >= lines.length) index = 0;
                attempts++;
                if (attempts > lines.length) {
                    isHighlighting = false;
                    return;
                }
            }

            lines.forEach((line) => line.classList.remove("tts_line"));
            const current = lines[index];

            current.classList.add("tts_line");
            current.scrollIntoView({ behavior: "smooth", block: "center" });
            progressText.textContent = `${index + 1} / ${lines.length}`;
            rangeInput.value = index;

            await createTTS(current.innerText, { rate });

            prev = current;
            index++;
            isHighlighting = false;
            highlightNextLine();
        }

        await highlightNextLine();
    }

    async function createTTS(text, { rate = 1, pitch = 1, voice = null } = {}) {
        return new Promise((resolve) => {
            if (!text.trim()) return resolve();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = "ko-KR";
            utterance.rate = rate;
            utterance.pitch = pitch;
            if (voice) utterance.voice = voice;

            utterance.onend = resolve;
            utterance.onerror = resolve;

            speechSynthesis.speak(utterance);
        });
    }
}

function createListenButton() {
    const wrapper = document.querySelector(".menu-bottom-wrapper");
    if (!wrapper || wrapper.querySelector(".listen-btn-wrapper")) return;
    const el = document.querySelector(".footer_btn");

    const item = document.createElement("div");
    item.className = "menu-bottom-item listen-btn-wrapper";

    const icon = document.createElement("img");
    icon.src = "//images.novelpia.com/img/new/viewer/navbar/headphones.svg";
    icon.className = "footer_btn";
    icon.style.filter = getComputedStyle(el).filter;

    const span = document.createElement("span");
    span.className = "footer_btn";
    span.style.filter = getComputedStyle(el).filter;
    span.textContent = "듣기";

    item.appendChild(icon);
    item.appendChild(span);

    item.addEventListener("click", () => {
        const drawingDiv = document.getElementById("novel_drawing");
        if (drawingDiv) drawingDiv.click();

        const load = document.createElement("div");
        load.style.textAlign = "center";
        load.style.filter = "invert(1)";
        load.style.display = "block";
        load.className = "loads";
        load.innerHTML = `
        <div class="loading"></div><br><br>
        <span style="text-align:center;color:#666;background-color:#eeeeee66;padding:6px 16px;cursor:pointer;border-radius:10px;font-size:12px;" onclick="$('.loads').hide();">페이지로딩 닫기</span>`;
        document.body.appendChild(load);
        observerContent();
    });

    const nextBtn = wrapper.querySelector("#recommend_tap");
    if (nextBtn) {
        wrapper.insertBefore(item, nextBtn);
    } else {
        wrapper.appendChild(item);
    }
}

window.addEventListener("load", () => {
    createListenButton();
});

function loadMaterialIcons() {
    const link = document.createElement("link");
    link.href =
        "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
}

loadMaterialIcons();

