// Separated queue logic into 3 levels based on relaxation level. 
// level 0:  queue:{lang}:{topic}:{difficulty}   full criteria
// level 1:  queue:{lang}:{topic}                difficulty relaxed (at 30 s)
// level 2:  queue:{lang}                        topic relaxed     (at 60 s)

function getQueueKeys({ languages, topics, difficulty }, level) {
  const keys = [];
  for (const lang of languages) {
    if (level >= 2) {
      // Topic dropped — one key per language only.
      keys.push(`queue:${lang}`);
    } else {
      for (const topic of topics) {
        if (level === 0) {
          keys.push(`queue:${lang}:${topic}:${difficulty}`);
        } else {
          keys.push(`queue:${lang}:${topic}`);
        }
      }
    }
  }
  return [...new Set(keys)];
}

// parse out topic and difficulty based on relaxation level
function parseMatchedCriteria(queueKey) {
  const parts = queueKey.split(':');
  const topic = parts[2] ?? null;
  const difficulty = parts[3] ?? null;
  return { topic, difficulty };
}

module.exports = { getQueueKeys, parseMatchedCriteria };
