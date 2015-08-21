import AbstractProcessor from './AbstractProcessor';

const nextLetter = [
    ';',
    ',',
    ')',
    '.',
    '+',
    '-',
    '*',
    '/',
    ' ',
];

export default class ValueProcessor extends AbstractProcessor {
    async process({ instruction, content }) {
        if (instruction === 'eval') {
            content = eval(content);
        } else {
            content = this.getDefined(content);
        }

        return {
            keepCallMe: true,
            replaceBy: String(content),
        };
    }

    async processLetter({ buffer, letter }) {
        if (buffer.length !== 0) {
            if (buffer === '0' && nextLetter.indexOf(letter) !== -1) {
                return {
                    ignoreBuffer: true,
                    ignoreLetter: letter === ' ',
                };
            }

            if (buffer === "'" && letter === "'") {
                return {
                    ignoreBuffer: true,
                    ignoreLetter: true,
                };
            }

            if ((buffer === 'fals' || buffer === 'tru') && letter === 'e') {
                return {
                    ignoreBuffer: true,
                    ignoreLetter: true,
                };
            }

            if (buffer.length > 5) {
                return false;
            }
        }

        if (letter === '0' || letter === "'" || letter === 'f' || letter === 't') {
            return {
                bufferLetter: true,
            };
        }
    }
}
