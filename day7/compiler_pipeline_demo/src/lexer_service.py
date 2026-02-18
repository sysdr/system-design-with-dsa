import re
import os
import json

TOKEN_TYPES = {
    'KEYWORD': r'\b(VAR|PRINT)\b',
    'IDENTIFIER': r'[a-zA-Z_][a-zA-Z0-9_]*',
    'NUMBER': r'\d+',
    'OPERATOR': r'(?:\+|-|\*|/|=)',
    'WHITESPACE': r'\s+',
    'UNKNOWN': r'.'
}

TOKEN_PATTERNS = [
    ('KEYWORD', TOKEN_TYPES['KEYWORD']),
    ('IDENTIFIER', TOKEN_TYPES['IDENTIFIER']),
    ('NUMBER', TOKEN_TYPES['NUMBER']),
    ('OPERATOR', TOKEN_TYPES['OPERATOR'])
]

def tokenize(source_code: str):
    tokens = []
    position = 0
    source_len = len(source_code)

    while position < source_len:
        whitespace_match = re.match(TOKEN_TYPES['WHITESPACE'], source_code[position:])
        if whitespace_match:
            position += len(whitespace_match.group(0))
            continue

        match = None
        for token_type, pattern in TOKEN_PATTERNS:
            regex = re.compile(pattern)
            m = regex.match(source_code, position)
            if m:
                tokens.append((token_type, m.group(0)))
                position = m.end(0)
                match = True
                break

        if not match:
            char = source_code[position]
            tokens.append(('UNKNOWN', char))
            position += 1

    return tokens

if __name__ == "__main__":
    base = os.path.dirname(__file__)
    proj = os.path.dirname(base)
    input_file = os.path.join(proj, 'minilang', 'input.minilang')
    output_file = os.path.join(proj, 'output', 'tokens.json')

    print("\n--- Lexer Service ---")
    print("Reading source code from:", input_file)

    try:
        with open(input_file, 'r') as f:
            source_code = f.read()

        print("\nSource Code:")
        print(source_code)

        tokens = tokenize(source_code)
        result = [{"type": t, "value": v} for t, v in tokens]

        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        with open(output_file, 'w') as f:
            json.dump(result, f, indent=2)

        print("\nTokens produced:", len(tokens))
        print("Output written to:", output_file)
    except FileNotFoundError as e:
        print("Error:", e)
        exit(1)
