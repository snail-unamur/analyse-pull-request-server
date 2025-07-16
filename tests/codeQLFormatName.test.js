import format from '../utils/codeQLFormatName.js';

test('Test', () => {
    const expected = 'com.acme.module2.Module2';
    const actual = format('module1/src/main/java/com/acme/module2/Module2.java');

    expect(actual).toBe(expected);
})