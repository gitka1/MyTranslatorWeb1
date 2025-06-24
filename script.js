// --- 設定項目 ---
// !!!!!! ここにあなたのDeepL APIキーを貼り付けてください !!!!!!
const DEEPL_API_KEY = "YOUR_DEEPL_API_KEY";
const DEEPL_API_URL = "https://api-free.deepl.com/v2/translate";

// --- HTML要素の取得 ---
const japaneseTextElement = document.getElementById("japanese-text");
const englishTextElement = document.getElementById("english-text");
const micJpButton = document.getElementById("mic-jp");
const micEnButton = document.getElementById("mic-en");
const speakerJpIcon = document.getElementById("speaker-jp");
const speakerEnIcon = document.getElementById("speaker-en");
const statusText = document.getElementById("status-text");

// --- Web Speech API の準備 ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// --- 音声認識のメイン処理 ---
function startVoiceRecognition(sourceLang, targetLang, sourceElement, targetElement) {
    if (!recognition) {
        statusText.textContent = "お使いのブラウザは音声認識に対応していません。";
        return;
    }

    // どのマイクボタンが押されたか分かるようにスタイルを変更
    const micButton = sourceLang === 'ja-JP' ? micJpButton : micEnButton;
    micButton.classList.add("is-recording");
    statusText.textContent = "話してください...";

    recognition.lang = sourceLang;
    recognition.interimResults = false; // 確定した結果のみ取得
    recognition.start();

    // 音声認識が結果を返したとき
    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        sourceElement.textContent = spokenText;
        translateText(spokenText, targetLang, targetElement);
    };

    // 音声認識が終了したとき
    recognition.onend = () => {
        micButton.classList.remove("is-recording");
        statusText.textContent = "ボタンを押して話してください";
    };

    // エラーが発生したとき
    recognition.onerror = (event) => {
        console.error("Speech Recognition Error", event.error);
        statusText.textContent = "エラーが発生しました。";
    };
}

// --- テキスト翻訳処理 ---
async function translateText(text, targetLang, targetElement) {
    if (!text || !DEEPL_API_KEY) {
        targetElement.textContent = "APIキーが設定されていないか、テキストが空です。";
        return;
    }
    
    targetElement.textContent = "翻訳中...";
    
    // DeepL APIにリクエスト
    try {
        const response = await fetch(DEEPL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `auth_key=${DEEPL_API_KEY}&text=${encodeURIComponent(text)}&target_lang=${targetLang}`,
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.translations && data.translations.length > 0) {
            const translatedText = data.translations[0].text;
            targetElement.textContent = translatedText;
        } else {
            targetElement.textContent = "翻訳に失敗しました。";
        }
    } catch (error) {
        console.error("Translation Error:", error);
        targetElement.textContent = "通信エラーが発生しました。";
    }
}

// --- 音声合成（読み上げ）処理 ---
function speakText(text, lang) {
    if (!text || text.includes("...")) return; // テキストがない、または処理中の場合は何もしない
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
}

// --- イベントリスナーの設定 ---
micJpButton.addEventListener("click", () => {
    startVoiceRecognition('ja-JP', 'EN-US', japaneseTextElement, englishTextElement);
});

micEnButton.addEventListener("click", () => {
    startVoiceRecognition('en-US', 'JA', englishTextElement, japaneseTextElement);
});

speakerJpIcon.addEventListener("click", () => {
    speakText(japaneseTextElement.textContent, 'ja-JP');
});

speakerEnIcon.addEventListener("click", () => {
    speakText(englishTextElement.textContent, 'en-US');
});