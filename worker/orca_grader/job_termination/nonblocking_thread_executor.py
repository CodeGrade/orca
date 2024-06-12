import concurrent.futures

class NonBlockingThreadPoolExecutor(concurrent.futures.ThreadPoolExecutor):
    
    def __exit__(self, exc_type, exc_val, exc_tb):
      self.shutdown(wait=False, cancel_futures=True)
      return False
        