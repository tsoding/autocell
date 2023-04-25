// 1, 9, 45, 165
// 1: 1
// 2: 9
// 3: 45
// 4: 165
// 5: 495

// automaton[state].transitions[nbor] = state1

function allNborsFreqs(state, xs = [], result = []) {
    const s = xs.reduce((a, b) => a + b, 0);
    if (state <= 0) {
        if (s === 8) {
            result.push([xs.join(""), xs.indexOf(Math.max(...xs))]);
        }
        return result;
    }
    for (let x = 0; x <= 8 - s; ++x) {
        xs.push(x);
        allNbors(state - 1, xs, result);
        xs.pop();
    }
    return result;
}

let result = allNbors(10);
console.log(result);
