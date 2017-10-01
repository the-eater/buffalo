function splitZoomBetween(arr, func, start, end) {
  start = start || 0;
  end = end || (arr.length - 1);
  const diff = end - start;

  if (diff < 1) {
    return null;
  }

  if (diff === 1) {
    return Math.sign(func(arr[start], arr[end])) > -1 ? [arr[start], arr[end]] : null;
  }

  const whole = Math.sign(func(arr[start], arr[end]));
  if (whole === -1) {
    return null;
  }

  if (whole === 0) {
    return [arr[start], arr[end]];
  }

  const middle = start + Math.ceil(diff / 2);
  const first = Math.sign(func(arr[start], arr[middle]));

  if (first === 0) {
    return [arr[start], arr[middle]];
  }

  if (first === 1) {
    return splitZoomBetween(arr, func, start, middle);
  }

  const last = Math.sign(func(arr[middle], arr[end]));

  if (last === 0) {
    return [arr[middle], arr[end]];
  }

  if (last === 1) {
    return splitZoomBetween(arr, func, middle, end);
  }

  return null;
}

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
    this.occupiedGaps = [];
    this.gaps = [new MemoryGap({ offset: 0, size: size })];
    this.gapSizes = [size];
    this.biggestGap = size;
  }

  free(offset, size) {
    // Safe to insert in front
    if (this.gaps[0].offset > (offset + size)) {
      this.gaps.unshift(new MemoryGap({ offset: offset, size: size }));
      return;
    }

    // space ends at first entry
    if (this.gaps[0].offset === (offset + size)) {
      this.gaps[0].offset = offset;
      this.gaps[0].size += size;
      return;
    }

    let end = this.gaps[this.gaps.length - 1];

    // Safe to insert after
    if ((end.offset + end.size) < offset) {
      this.gaps.push(new MemoryGap({ offset: offset, size: size }));
      return;
    }

    // space start at the end of last entry
    if ((end.offset + end.size) === offset) {
      end.size += size;
      return;
    }

    let boundaries = splitZoomBetween(Object.keys(this.gaps), (aKey, bKey) => {
      const a = this.gaps[aKey];
      const b = this.gaps[bKey];
      if ((a.offset + a.size) <= offset && (offset + size) <= b.offset) {
        return 1;
      }

      return -1;
    });

    if (boundaries === null) {
      throw new Error("Tried to free already freed memory");
    }

    let gap = new MemoryGap({ offset: offset, size: size });
    const leftGap = this.gaps[boundaries[0]];
    const rightGap = this.gaps[boundaries[1]];
    const spliceAdd = [];
    let spliceIndex = boundaries[1];
    let spliceDelete = 0;
    let needsNew = true;
    let usedLeft = false;
    let usedRight = false;
    if ((leftGap.offset + leftGap.size) === offset) {
      gap = leftGap;
      leftGap.size += size;
      spliceIndex--;
      needsNew = false;
      usedLeft = true;
    }

    if ((offset + size) === rightGap.offset) {
      rightGap.offset = gap.offset;
      rightGap.size += gap.size;
      usedRight = true;
      needsNew = false;
    }

    if (usedLeft && usedRight) {
      spliceDelete++;
    }

    if (needsNew) {
      spliceAdd.push(gap);
    }

    this.gaps.splice(spliceIndex, spliceDelete, ...spliceAdd);

    let gaps = [leftGap, rightGap, gap];
    for (let i = 0; i < gaps.length; i++) {
      if (gaps[i].size > this.biggestGap) {
        this.biggestGap = gaps[i].size;
      }
    }
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

    const over = gap.size - size;
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

  free(pageIndex, offset, size) {
    this.pages[pageIndex].free(offset, size);
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

  *getPagesWithEnoughSpace(size) {
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
    splitZoomBetween: splitZoomBetween,
  };
}