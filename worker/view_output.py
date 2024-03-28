import json 

if __name__ == '__main__':
  with open('output.json', 'r') as output_fp:
    output = json.load(output_fp)
    if "tap_output" in output:
      print(output["tap_output"])
    else:
      print("STDOUT:")
      print(output["shell_responses"][-1]["stdout"])
      print("STDERR:")
      print(output["shell_responses"][-1]["stderr"])
      if "execution_errors" in output:
        print("EXECUTION ERRORS:")
        print(output["execution_errors"])
