# -*- coding: utf-8 -*-

"""
Unicode Texture Sheet Mapper for Minecraft Emotes (CLI Mode)
------------------------------------------------------------
Sticky option input flow:
- On start, lists options a/b/c. Type a letter to select an option.
- After selecting, enter only the parameters for that option on new lines.
- You can switch option any time by typing a different letter (a/b/c).
- If parameters don't match the selected option, an error is shown.

Options:
 a) ASCII -> page,row,col
 b) page,row,col -> ASCII
 c) ASCII + offset -> ASCII
"""

def ascii_to_page_coords(ascii_code):
    if isinstance(ascii_code, str):
        if ascii_code.startswith("\\u"):
            code_int = int(ascii_code[2:], 16)
        else:
            code_int = int(ascii_code, 16)
    else:
        code_int = ascii_code

    page_number = code_int >> 8
    offset_in_page = code_int & 0xFF
    row = offset_in_page >> 4
    col = offset_in_page & 0xF

    return {
        'page': format(page_number, 'X').upper(),
        'row': row,
        'col': col,
        'unicode': f"\\u{code_int:04X}"
    }


def page_coords_to_ascii(page, row, col):
    if isinstance(page, str):
        page_int = int(page, 16)
    else:
        page_int = page

    ascii_int = (page_int << 8) + (row << 4) + col
    return f"\\u{ascii_int:04X}"


def ascii_with_offset(ascii_code, offset):
    if isinstance(ascii_code, str):
        if ascii_code.startswith("\\u"):
            code_int = int(ascii_code[2:], 16)
        else:
            code_int = int(ascii_code, 16)
    else:
        code_int = ascii_code

    new_code = code_int + offset
    return f"\\u{new_code:04X}"


def print_help():
     print("""
Sticky mode commands:
- Type a/b/c to select an option, then enter parameters only.
- Type 'help' to reprint this help and options.
- Type 'exit' (or 'quit'/'q') to leave.

Options:
  a) ASCII -> page,row,col
      params: <ASCII hex or \\uXXXX>
      e.g.:  \\uE101   or   E101

  b) page,row,col -> ASCII
      params: <page_hex> <row 0-15> <col 0-15>
      e.g.:   E1 0 1

  c) ASCII + offset -> ASCII
      params: <ASCII hex or \\uXXXX> <offset int>
      e.g.:   \\uE100 16
""")


def main():
    print("Unicode Texture Sheet Mapper CLI (sticky options)")
    print_help()

    # Define options and how to execute them
    def run_a(params):
        if len(params) != 1:
            raise ValueError("Usage (a): <ASCII hex or \\uXXXX>  e.g. \\uE101")
        raw = params[0]
        result = ascii_to_page_coords(raw)
        print(f"ASCII {result['unicode']} -> page {result['page']}, row {result['row']}, col {result['col']}")

    def run_b(params):
        if len(params) != 3:
            raise ValueError("Usage (b): <page_hex> <row 0-15> <col 0-15>  e.g. E1 0 1")
        page_raw, row_raw, col_raw = params
        page_int = int(page_raw, 16)
        row = int(row_raw)
        col = int(col_raw)
        if not (0 <= row <= 0xF) or not (0 <= col <= 0xF):
            raise ValueError("row and col must be between 0 and 15 (0x0 .. 0xF)")
        ascii_code = page_coords_to_ascii(page_int, row, col)
        print(f"Page {page_raw.upper()}, row {row}, col {col} -> ASCII {ascii_code}")

    def run_c(params):
        if len(params) != 2:
            raise ValueError("Usage (c): <ASCII hex or \\uXXXX> <offset int>  e.g. \\uE100 16")
        raw, off_raw = params
        offset = int(off_raw)
        new_ascii = ascii_with_offset(raw, offset)
        print(f"ASCII {raw} + {offset} -> {new_ascii}")

    options = {
        'a': {
            'name': 'ASCII -> page,row,col',
            'usage': "Enter: <ASCII hex or \\uXXXX>  e.g. \\uE101",
            'runner': run_a,
        },
        'b': {
            'name': 'page,row,col -> ASCII',
            'usage': "Enter: <page_hex> <row 0-15> <col 0-15>  e.g. E1 0 1",
            'runner': run_b,
        },
        'c': {
            'name': 'ASCII + offset -> ASCII',
            'usage': "Enter: <ASCII hex or \\uXXXX> <offset int>  e.g. \\uE100 16",
            'runner': run_c,
        },
    }

    def print_options_summary(current=None):
        print("\nOptions:")
        for key in sorted(options.keys()):
            marker = "*" if key == current else " "
            print(f"  [{key}] {options[key]['name']} {marker}")
        if current:
            print(f"Selected [{current}] -> {options[current]['usage']}")
        print()

    current_option = None
    while True:
        try:
            line = input("> ").strip()
            if not line:
                continue

            lower = line.lower()
            if lower in ("exit", "quit", "q"):
                break
            if lower == "help":
                print_help()
                print_options_summary(current_option)
                continue

            tokens = line.split()
            first = tokens[0].lower()

            # Allow switching option by typing a/b/c, optionally followed by params
            if first in options:
                current_option = first
                params = tokens[1:]
                if params:
                    try:
                        options[current_option]['runner'](params)
                    except Exception as inner_e:
                        print(f"Error: {inner_e}")
                        print(options[current_option]['usage'])
                else:
                    print(f"Selected [{current_option}] {options[current_option]['name']}")
                    print(options[current_option]['usage'])
                continue

            # Otherwise, treat input as params for the current option
            if not current_option:
                print("Please select an option first: a/b/c (type 'help' to see details).")
                print_options_summary()
                continue

            try:
                options[current_option]['runner'](tokens)
            except Exception as e:
                print(f"Error: {e}")
                print(options[current_option]['usage'])

        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    main()
