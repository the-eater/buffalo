
class MemoryGap {
  constructor({ offset, size, end }) {
    this.offset = offset;
    this.size = size || (end - offset);
    this.end = end || (offset + size);
  }
}

class MemoryPage {
  constructor({ size, offset = 0, index }) {
    this.index = index;
    this.buffer = new ArrayBuffer(size);
    this.offset = offset;
    this.gaps = [new MemoryGap({ offset: 0, size: size })];
    this.gapSizes = [size];
    this.biggestGap = size;
  }

  alloc(size) {
    if (this.biggestGap < size) {
      return false;
    }

    let selectedGap = false;

    for (let i = 0; i < this.gaps.length; i++) {
      let gap = this.gaps[i];
      if (gap.size >= size) {
        selectedGap = i;
        return this.allocOnGap(selectedGap, size);
      }
    }
  }

  allocOnGap(index, size) {
    const gap = this.gaps[index];
    const recount = gap.size === this.biggestGap;

    const over = gap.size - (gap.offset + size);
    const offset = gap.offset;
    if (over === 0) {
      this.gaps.splice(index, 1);
      this.gapSizes.splice(index, 1);
    }

    // Fix old gap
    gap.offset += size;
    gap.size -= size;
    gap.end -= size;

    if (recount) {
      this.biggestGap = Math.max(...this.gapSizes);
    }

    return { offset: offset, buffer: this.buffer, page: this.index };
  }
}

class MemoryManager {
  constructor({ size, maxSize = Infinity, pageSize = (16 * 1024 * 1024), pageType = MemoryPage }) {
    this.pageSize = pageSize;
    this.pageType = pageType;
    this.maxSize = maxSize;
    this.size = 0;
    this.pages = [];

    if (size) {
      this.grow(size);
    }
  }

  grow(size = 1) {
    let oldSize = this.size;
    while ((this.size - oldSize) < size) {
      this.addPage();
    }
  }

  addPage() {
    const pageSize = this.pageSize;
    const newSize = pageSize + this.size;
    if (newSize > this.maxSize) {
      throw new Error("Reached max memory can't allocate more");
    }

    this.pages.push(new this.pageType({ size: pageSize, offset: this.size, index: this.pages.length }));
    this.size += pageSize;
  }

  alloc(size) {
    let generator = this.getPagesWithEnoughSpace(size);
    for (let done = false, value = false; ({ value, done } = generator.next()) && !done;)
    {
      let place = value.alloc(size);

      if (place !== false) {
        return place;
      }
    }

    return false;
  }

  allocType(type) {
    // 4 is a safe assumption
    const modulo = type.modulo || 4;
    const worstSize = type.size + modulo - 1;

    return this.alloc(worstSize);
  }

  createType(type) {
    // 4 is a safe assumption
    const modulo = type.modulo || 4;
    let place = this.allocType(type);

    if (place === false) {
      throw new Error("Can't find place to allocate " + type.name);
    }

    place.offset += modulo - (place.offset % modulo || modulo);

    return new type({
      buffer: place.buffer,
      offset: place.offset,
      memoryManager: {
        page: place.page,
        instance: this
      }
    });
  }

  * getPagesWithEnoughSpace(size) {
    let i = 0;
    for (; i < this.pages.length; i++) {
      let page = this.pages[i];
      if (page.biggestGap >= size) {
        yield page;
      }
    }

    this.addPage();
    // i is old index + 1
    yield this.pages[i];
  }
}

if (module) {
  module.exports = {
    MemoryManager: MemoryManager,
    MemoryPage: MemoryPage,
    MemoryGap: MemoryGap,
  };
}