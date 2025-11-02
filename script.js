document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('wordInput');
    const definitionBox = document.getElementById('definitionBox');
    const voiceBtn = document.getElementById('voiceBtn');
    const suggestionBox = document.getElementById('suggestions');

    function saveToHistory(query, result) {
        const history = JSON.parse(localStorage.getItem('lookupHistory')) || [];
        history.unshift({ query, result, timestamp: Date.now() });
        localStorage.setItem('lookupHistory', JSON.stringify(history.slice(0, 20)));
    }

    function fetchDefinition(word) {
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
            .then(res => res.json())
            .then(data => {
                const defs = data[0]?.meanings?.flatMap(m => m.definitions) || [];
                if (defs.length === 0) {
                    definitionBox.textContent = 'No definition found.';
                    return;
                }
                const result = defs.map(d => d.definition).join('\n');
                definitionBox.innerHTML = `<div class="chat-bubble"><strong>${word}:</strong><ul>` +
                    defs.map((d, i) => `<li>${d.definition}</li>`).join('') +
                    '</ul></div>';
                saveToHistory(word, result);
            })
            .catch(err => {
                console.error('Definition fetch error:', err);
                definitionBox.textContent = 'Definition not found.';
            });
    }

    function fetchProgrammingAnswer(query) {
        const encoded = encodeURIComponent(query);
        definitionBox.innerHTML = `<div class="chat-bubble">Try this on <a href="https://stackoverflow.com/search?q=${encoded}" target="_blank">Stack Overflow</a></div>`;
    }

    function extractKeyword(text) {
        const patterns = [
            /define\s+(\w+)/i,
            /meaning of\s+(\w+)/i,
            /what does\s+(\w+)\s+mean/i,
            /^(\w+)$/i
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function isProgrammingQuestion(text) {
        const keywords = ['javascript', 'python', 'html', 'css', 'loop', 'function', 'variable', 'array', 'object', 'class'];
        return keywords.some(kw => text.toLowerCase().includes(kw));
    }

    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = input.value.trim();
            if (!query) return;

            definitionBox.innerHTML = '<em>Loading...</em>';

            if (isProgrammingQuestion(query)) {
                fetchProgrammingAnswer(query);
            } else {
                const keyword = extractKeyword(query) || query;
                fetchDefinition(keyword);
            }
        }
    });

    voiceBtn.addEventListener('click', () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.start();

        recognition.onresult = event => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        };
    });

    input.addEventListener('input', () => {
        const query = input.value.trim();
        if (!query) return;

        fetch(`https://api.datamuse.com/sug?s=${query}`)
            .then(res => res.json())
            .then(data => {
                const suggestions = data.map(item => item.word).slice(0, 5);
                showSuggestions(suggestions);
            });
    });

    function showSuggestions(words) {
        suggestionBox.innerHTML = words.map(w => `<div class="suggestion">${w}</div>`).join('');
        document.querySelectorAll('.suggestion').forEach(el => {
            el.onclick = () => {
                input.value = el.textContent;
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
            };
        });
    }
});
// service-worker.js
self.addEventListener('install', () => {
    self.skipWaiting();
});
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Service Worker registered:', reg.scope))
        .catch(err => console.error('Service Worker registration failed:', err));
}
