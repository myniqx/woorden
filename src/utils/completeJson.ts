type State =
  | 'ROOT'
  | 'FINISH'
  | 'INSIDE_STRING'
  | 'INSIDE_STRING_ESCAPE'
  | 'INSIDE_STRING_UNICODE_ESCAPE'
  | 'INSIDE_LITERAL'
  | 'INSIDE_NUMBER'
  | 'INSIDE_OBJECT_START'
  | 'INSIDE_OBJECT_KEY'
  | 'INSIDE_OBJECT_AFTER_KEY'
  | 'INSIDE_OBJECT_BEFORE_VALUE'
  | 'INSIDE_OBJECT_AFTER_VALUE'
  | 'INSIDE_OBJECT_AFTER_COMMA'
  | 'INSIDE_ARRAY_START'
  | 'INSIDE_ARRAY_AFTER_VALUE'
  | 'INSIDE_ARRAY_AFTER_COMMA';

function isHexDigit(char: string): boolean {
  return (
    (char >= '0' && char <= '9') ||
    (char >= 'A' && char <= 'F') ||
    (char >= 'a' && char <= 'f')
  );
}

function processValueStart(
  char: string,
  i: number,
  swapState: State,
  stack: State[],
  lastValidIndex: { value: number },
  literalStart: { value: number | null },
): void {
  switch (char) {
    case '"': {
      lastValidIndex.value = i;
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_STRING');
      break;
    }
    case 'f':
    case 't':
    case 'n': {
      lastValidIndex.value = i;
      literalStart.value = i;
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_LITERAL');
      break;
    }
    case '-': {
      // '-' alone is not yet a valid number, don't update lastValidIndex
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_NUMBER');
      break;
    }
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9': {
      lastValidIndex.value = i;
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_NUMBER');
      break;
    }
    case '{': {
      lastValidIndex.value = i;
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_OBJECT_START');
      break;
    }
    case '[': {
      lastValidIndex.value = i;
      stack.pop();
      stack.push(swapState);
      stack.push('INSIDE_ARRAY_START');
      break;
    }
  }
}

function processAfterObjectValue(
  char: string,
  i: number,
  stack: State[],
  lastValidIndex: { value: number },
): void {
  switch (char) {
    case ',': {
      stack.pop();
      stack.push('INSIDE_OBJECT_AFTER_COMMA');
      break;
    }
    case '}': {
      lastValidIndex.value = i;
      stack.pop();
      break;
    }
  }
}

function processAfterArrayValue(
  char: string,
  i: number,
  stack: State[],
  lastValidIndex: { value: number },
): void {
  switch (char) {
    case ',': {
      stack.pop();
      stack.push('INSIDE_ARRAY_AFTER_COMMA');
      break;
    }
    case ']': {
      lastValidIndex.value = i;
      stack.pop();
      break;
    }
  }
}

function closeLiteral(
  input: string,
  literalStart: { value: number | null },
  result: string,
): string {
  if (literalStart.value === null) return result;
  const partialLiteral = input.substring(literalStart.value, input.length);
  if ('true'.startsWith(partialLiteral)) {
    return result + 'true'.slice(partialLiteral.length);
  } else if ('false'.startsWith(partialLiteral)) {
    return result + 'false'.slice(partialLiteral.length);
  } else if ('null'.startsWith(partialLiteral)) {
    return result + 'null'.slice(partialLiteral.length);
  }
  return result;
}

// Completes partial/truncated JSON by scanning in linear time and closing
// all open structures. Invalid JSON is not handled — a standard JSON.parse
// after this call will catch any remaining syntax errors.
export function completeJson(input: string): string {
  const stack: State[] = ['ROOT'];
  const lastValidIndex = { value: -1 };
  const literalStart = { value: null as number | null };
  let unicodeEscapeDigits = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const currentState = stack[stack.length - 1];

    switch (currentState) {
      case 'ROOT': {
        processValueStart(char, i, 'FINISH', stack, lastValidIndex, literalStart);
        break;
      }

      case 'INSIDE_OBJECT_START': {
        switch (char) {
          case '"': {
            stack.pop();
            stack.push('INSIDE_OBJECT_KEY');
            break;
          }
          case '}': {
            lastValidIndex.value = i;
            stack.pop();
            break;
          }
        }
        break;
      }

      case 'INSIDE_OBJECT_AFTER_COMMA': {
        if (char === '"') {
          stack.pop();
          stack.push('INSIDE_OBJECT_KEY');
        }
        break;
      }

      case 'INSIDE_OBJECT_KEY': {
        if (char === '"') {
          stack.pop();
          stack.push('INSIDE_OBJECT_AFTER_KEY');
        }
        break;
      }

      case 'INSIDE_OBJECT_AFTER_KEY': {
        if (char === ':') {
          stack.pop();
          stack.push('INSIDE_OBJECT_BEFORE_VALUE');
        }
        break;
      }

      case 'INSIDE_OBJECT_BEFORE_VALUE': {
        processValueStart(char, i, 'INSIDE_OBJECT_AFTER_VALUE', stack, lastValidIndex, literalStart);
        break;
      }

      case 'INSIDE_OBJECT_AFTER_VALUE': {
        processAfterObjectValue(char, i, stack, lastValidIndex);
        break;
      }

      case 'INSIDE_STRING': {
        switch (char) {
          case '"': {
            lastValidIndex.value = i;
            stack.pop();
            break;
          }
          case '\\': {
            stack.push('INSIDE_STRING_ESCAPE');
            break;
          }
          default: {
            lastValidIndex.value = i;
            break;
          }
        }
        break;
      }

      case 'INSIDE_STRING_ESCAPE': {
        stack.pop();
        if (char === 'u') {
          unicodeEscapeDigits = 0;
          stack.push('INSIDE_STRING_UNICODE_ESCAPE');
        } else {
          lastValidIndex.value = i;
        }
        break;
      }

      case 'INSIDE_STRING_UNICODE_ESCAPE': {
        if (isHexDigit(char)) {
          unicodeEscapeDigits++;
          if (unicodeEscapeDigits === 4) {
            stack.pop();
            lastValidIndex.value = i;
          }
        } else {
          // Invalid unicode escape — treat as broken, pop and continue
          stack.pop();
        }
        break;
      }

      case 'INSIDE_ARRAY_START': {
        if (char === ']') {
          lastValidIndex.value = i;
          stack.pop();
        } else {
          processValueStart(char, i, 'INSIDE_ARRAY_AFTER_VALUE', stack, lastValidIndex, literalStart);
        }
        break;
      }

      case 'INSIDE_ARRAY_AFTER_VALUE': {
        processAfterArrayValue(char, i, stack, lastValidIndex);
        break;
      }

      case 'INSIDE_ARRAY_AFTER_COMMA': {
        processValueStart(char, i, 'INSIDE_ARRAY_AFTER_VALUE', stack, lastValidIndex, literalStart);
        break;
      }

      case 'INSIDE_NUMBER': {
        switch (char) {
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9': {
            lastValidIndex.value = i;
            break;
          }
          case 'e':
          case 'E':
          case '+':
          case '-':
          case '.': {
            // These extend a number but aren't valid end points — don't update lastValidIndex
            break;
          }
          case ',': {
            stack.pop();
            const stateAfterComma = stack[stack.length - 1];
            if (stateAfterComma === 'INSIDE_ARRAY_AFTER_VALUE') {
              processAfterArrayValue(char, i, stack, lastValidIndex);
            } else if (stateAfterComma === 'INSIDE_OBJECT_AFTER_VALUE') {
              processAfterObjectValue(char, i, stack, lastValidIndex);
            }
            break;
          }
          case '}': {
            stack.pop();
            if (stack[stack.length - 1] === 'INSIDE_OBJECT_AFTER_VALUE') {
              processAfterObjectValue(char, i, stack, lastValidIndex);
            }
            break;
          }
          case ']': {
            stack.pop();
            if (stack[stack.length - 1] === 'INSIDE_ARRAY_AFTER_VALUE') {
              processAfterArrayValue(char, i, stack, lastValidIndex);
            }
            break;
          }
          default: {
            stack.pop();
            break;
          }
        }
        break;
      }

      case 'INSIDE_LITERAL': {
        const partialLiteral = input.substring(literalStart.value!, i + 1);
        if (
          !'false'.startsWith(partialLiteral) &&
          !'true'.startsWith(partialLiteral) &&
          !'null'.startsWith(partialLiteral)
        ) {
          stack.pop();
          const stateAfterLiteral = stack[stack.length - 1];
          if (stateAfterLiteral === 'INSIDE_OBJECT_AFTER_VALUE') {
            processAfterObjectValue(char, i, stack, lastValidIndex);
          } else if (stateAfterLiteral === 'INSIDE_ARRAY_AFTER_VALUE') {
            processAfterArrayValue(char, i, stack, lastValidIndex);
          }
        } else {
          lastValidIndex.value = i;
        }
        break;
      }
    }
  }

  let result = input.slice(0, lastValidIndex.value + 1);

  for (let i = stack.length - 1; i >= 0; i--) {
    const state = stack[i];
    switch (state) {
      case 'INSIDE_STRING': {
        result += '"';
        break;
      }
      case 'INSIDE_OBJECT_KEY':
      case 'INSIDE_OBJECT_AFTER_KEY':
      case 'INSIDE_OBJECT_AFTER_COMMA':
      case 'INSIDE_OBJECT_START':
      case 'INSIDE_OBJECT_BEFORE_VALUE':
      case 'INSIDE_OBJECT_AFTER_VALUE': {
        result += '}';
        break;
      }
      case 'INSIDE_ARRAY_START':
      case 'INSIDE_ARRAY_AFTER_COMMA':
      case 'INSIDE_ARRAY_AFTER_VALUE': {
        result += ']';
        break;
      }
      case 'INSIDE_LITERAL': {
        result = closeLiteral(input, literalStart, result);
        break;
      }
    }
  }

  return result;
}
