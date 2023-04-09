import requests

__RETRIEVAL_TIMEOUT = 2.5 # seconds
__FILE_DOWNLOAD_CHUNK_SIZE = 8192

def download_file(url: str, output_path: str) -> str:
  """
  Downloads a file from the given URL and outputs it to the given file path. Returns
  the file path upon successful write.
  """
  with requests.get(url, stream=True, timeout=__RETRIEVAL_TIMEOUT) as web_response:
      web_response.raise_for_status()
      with open(output_path, "wb") as f:
        for chunk in web_response.iter_content(chunk_size=__FILE_DOWNLOAD_CHUNK_SIZE):
          f.write(chunk)
  return output_path