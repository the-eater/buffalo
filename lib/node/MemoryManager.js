"use strict";

/**
 * This function will constantly compare 2 points with func and zoom in till it has 2 points next to each other, or a perfect match
 *
 * @param {function(Number, Number):Number} func
 *
 * The callback used, you should return 1, 0 or -1
 *
 * - 1 means further zooming may be required
 * - 0 means perfect match and it will return instantly
 * - -1 means it doesn't match and it will stop looking at this bit of the array
 *
 * @param {Number} start
 * @param {Number} end
 * @return {Number[]|null} null or 2 items
 */
function splitZoomBetweenIndex(func, start, end) {

    let diff = end - start;

    if (diff < 1) {
        return null;
    }

    const whole = Math.sign(func(start, end));

    if (whole === -1) {
        return null;
    }

    if (whole === 0 || (diff === 1 && whole !== -1)) {
        return [start, end];
    }

    while ((diff = (end - start)) > 1) {
        const middle = start + Math.ceil(diff / 2);
        const first = Math.sign(func(start, middle));

        if (first === 0) {
            return [start, middle];
        }

        if (first === 1) {
            end = middle;
            continue;
        }

        const last = Math.sign(func(middle, end));

        if (last === 0) {
            return [middle, end];
        }

        if (last === 1) {
            start = middle;
            continue;
        }

        return null;
    }
    return [start, end];
}

/**
 * This function will constantly compare 2 points in an array and zoom in till it has 2 points next to each other, or a perfect match
 *
 * @param {Array} arr
 * @param {function(*, *): Number} func
 *
 * The callback used, you should return 1, 0 or -1
 *
 * - 1 means further zooming may be required
 * - 0 means perfect match and it will return instantly
 * - -1 means it doesn't match and it will stop looking at this bit of the array
 *
 * @param {Number} [start=0]
 * @param {Number} [end=arr.length - 1]
 * @return {Array|null} null or 2 items
 */
function splitZoomBetween(arr, func, start, end) {

    start = start || 0;
    end = end || (arr.length - 1);

    const result = splitZoomBetweenIndex((a, b) => func(arr[a], arr[b]), start, end);

    if (result === null) {
        return null;
    }

    return [arr[result[0]], arr[result[1]]];
}

/**
 * Represents an type
 *
 * @interface
 */
class IType {
    /**
     * @return {Number}
     */
    static get id() {
        throw new Error("Not implemented");
    }

    /**
     * @return {Number}
     */
    static get size() {
        throw new Error("Not implemented");
    }

    /**
     * @param {Number} offset
     * @param {ArrayBuffer|SharedArrayBuffer} buffer
     * @param {MemoryPosition} [position]
     */
    constructor({
        offset,
        buffer,
        position = null
    }) {
        throw new Error("Not implemented");
    }
}

/**
 * Represents a bit of memory that is not allocated aka a gap
 */
class MemoryGap {
    /**
     * @param {Object} _
     * @param {Number} _.offset
     * @param {Number} _.size
     * @param {Number} _.end
     */
    constructor({
        offset,
        size,
        end
    }) {
        this.offset = offset;
        this.size = size || (end - offset);
        this.end = end || (offset + size);
    }
}

/**
 * A memory position, returned when allocating memory
 */
class MemoryPosition {

    /**
     * @param {Object} _
     * @param {Number} _.offset
     * @param {Number} _.size
     * @param {ArrayBuffer|SharedArrayBuffer} _.buffer
     * @param {MemoryPage} _.page
     * @param {boolean} _.allocated
     * @param {MemoryManager} _.memoryManager
     */
    constructor({
        offset,
        size,
        buffer,
        page,
        allocated,
        memoryManager
    }) {
        this.offset = offset;
        this.size = size;
        this.buffer = buffer;
        this.page = page;
        this.allocated = allocated;
        this.memoryManager = memoryManager;
    }

    /**
     * Free this memory position
     */
    free() {
        if (this.memoryManager && this.allocated) {
            this.memoryManager.free(this.page, this.offset, this.size);
            this.allocated = false;
        }
    }

    /**
     * Spawn an Type on this position
     */
    spawn(type) {
        let modulo = type.modulo || 4;
        let ourOffset = this.offset + modulo - (this.offset % modulo || modulo);

        return new type({
            buffer: this.buffer,
            offset: ourOffset,
            position: this,
        });
    }
}

/**
 * A memory page instance, holds the actually ArrayBuffer
 */
class MemoryPage {

    /**
     * Create a new memory page
     *
     * @param {Object} _
     * @param {Number} _.size the size of this page
     * @param {Number} [_.offset=0] the offset from the start of the bytes in the memory manager
     * @param {Number} _.index the page index of this page
     * @param {Number} _.memoryManager the memory manager this page resides in
     */
    constructor({
        size,
        offset = 0,
        index,
        memoryManager
    }) {
        this.index = index;
        this.buffer = new ArrayBuffer(size);
        this.offset = offset;
        this.memoryManager = memoryManager;
        this.gaps = [new MemoryGap({
            offset: 0,
            size: size
        })];
        this.gapSizes = [size];
        this.biggestGap = size;
    }

    /**
     * @private
     * @param {Number} index
     * @param {Number} length
     */
    updateGapSizes(index, length) {
        let max = Math.min(this.gaps.length, index + length);
        for (let i = index; i < max; i++) {
            this.gapSizes[i] = this.gaps[i].size;

            if (this.biggestGap < this.gapSizes[i]) {
                this.biggestGap = this.gapSizes[i];
            }
        }
    }

    /**
     * Free allocated memory
     *
     * @param {Number} offset
     * @param {Number} size
     */
    free(offset, size) {
        // Safe to insert in front
        if (this.gaps[0].offset > (offset + size)) {
            const newGap = new MemoryGap({
                offset: offset,
                size: size
            });
            this.gaps.unshift(newGap);
            this.gapSizes.unshift(size);
            this.updateGapSizes(0, 1);
            return;
        }

        // space ends at first entry
        if (this.gaps[0].offset === (offset + size)) {
            this.gaps[0].offset = offset;
            this.gaps[0].size += size;
            this.updateGapSizes(0, 1);
            return;
        }

        let end = this.gaps[this.gaps.length - 1];

        // Safe to insert after
        if ((end.offset + end.size) < offset) {
            this.gaps.push(new MemoryGap({
                offset: offset,
                size: size
            }));
            this.gapSizes.push(size);
            this.updateGapSizes(this.gapSizes.length - 1, 1);
            return;
        }

        // space start at the end of last entry
        if ((end.offset + end.size) === offset) {
            end.size += size;
            this.updateGapSizes(this.gaps.length - 1, 1);
            return;
        }

        let boundaries = splitZoomBetweenIndex((aKey, bKey) => {
            const a = this.gaps[aKey];
            const b = this.gaps[bKey];
            if ((a.offset + a.size) <= offset && (offset + size) <= b.offset) {
                return 1;
            }

            return -1;
        }, 0, this.gaps.length - 1);

        if (boundaries === null) {
            throw new Error("Tried to free already freed memory");
        }

        let gap = new MemoryGap({
            offset: offset,
            size: size
        });
        const leftGap = this.gaps[boundaries[0]];
        const rightGap = this.gaps[boundaries[1]];
        const spliceAdd = [];
        const spliceSizeAdd = [];
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
            spliceSizeAdd.push(gap.size);
        }

        this.gaps.splice(spliceIndex, spliceDelete, ...spliceAdd);
        this.gapSizes.splice(spliceIndex, spliceDelete, ...spliceSizeAdd);
        this.updateGapSizes(spliceIndex, 3);
    }

    /**
     * Allocate memory
     *
     * @param {Number} size
     * @return {MemoryPosition}
     */
    alloc(size) {
        if (this.biggestGap < size) {
            throw new Error(`Page doesn't have space for allocation of ${size} bytes biggest gap is ${this.biggestGap}`);
        }

        for (let i = 0; i < this.gaps.length; i++) {
            let gap = this.gaps[i];
            if (gap.size >= size) {
                return this.allocOnGap(i, size);
            }
        }
    }

    getPosition(offset, size, allocated = true) {
        return new MemoryPosition({
            offset: offset,
            size: size,
            buffer: this.buffer,
            page: this.index,
            memoryManager: this.memoryManager,
            allocated: allocated
        });
    }

    /**
     * Allocate memory on given gap
     *
     * @param {Number} index
     * @param {Number} size
     * @return {MemoryPosition}
     */
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

        if (over > 0) {
            this.gapSizes[index] = gap.size;
        }

        if (recount) {
            this.biggestGap = Math.max(0, ...this.gapSizes);
        }

        return this.getPosition(offset, size, true);
    }
}

class MemoryManager {
    /**
     * Creates a new MemoryManager object
     *
     * @param {Object} _
     * @param {Number} [_.size=0] Initial size to reserve
     * @param {Number} [_.maxSize=Infinity] How much space may we take up
     * @param {Number} [_.pageSize=16777216] How big should the memory pages be
     * @param {Function} [_.pageType=function(new:MemoryPage)] What instance of memory pages should we use
     */
    constructor({
        size = 0,
        maxSize = Infinity,
        pageSize = 16777216,
        pageType = MemoryPage
    }) {
        this.pageSize = pageSize;
        this.pageType = pageType;
        this.maxSize = maxSize;
        this.size = 0;

        /**
         * @type {MemoryPage[]}
         */
        this.pages = [];

        /**
         * @type {Object.<string, function(new:IType)>}
         */
        this.types = {};

        if (size > 0) {
            this.grow(size);
        }
    }

    /**
     * Grow reserved space
     *
     * @param {Number} size how much do we need to grow
     */
    grow(size = 1) {
        let oldSize = this.size;
        while ((this.size - oldSize) < size) {
            this.addPage();
        }
    }

    /**
     * Register a type to the memory manager
     *
     * @param {function(new:IType)} type
     */
    registerType(type) {
        if (type.id < 1) {
            throw new Error('Given type has invalid ID');
        }

        this.types[type.id] = type;
    }

    /**
     * @param {Number} id
     * @return {function(new:IType)|null}
     */
    retrieveTypeById(id) {
        if (this.types[id] !== undefined) {
            return this.types[id];
        }

        return null;
    }

    /**
     * Extracts an value at given position
     *
     * @param {Number} pageIndex
     * @param {Number} offset
     */
    extractValue(pageIndex, offset) {
        let position = this.getPosition(pageIndex, offset, 4);
        let idU32 = new Uint32Array(position.buffer, position.offset, 1);
        let type = this.retrieveTypeById(idU32[0]);
        if (type === null) {
            throw new Error(`Unkown type at [${pageIndex},${offset}] with id ${idU32[0]}`);
        }

        return position.spawn(type);
    }

    /**
     * Add another memory page
     */
    addPage() {
        const pageSize = this.pageSize;
        const newSize = pageSize + this.size;
        if (newSize > this.maxSize) {
            throw new Error("Reached max memory can't allocate more");
        }

        this.pages.push(new this.pageType({
            size: pageSize,
            offset: this.size,
            index: this.pages.length,
            memoryManager: this,
        }));

        this.size += pageSize;
    }

    /**
     * Allocate N bytes, will return an MemoryPosition on success or null on false
     *
     * @param size how much bytes to allocate
     * @return {MemoryPosition|null}
     */
    alloc(size) {
        if (size > this.pageSize) {
            throw new Error(`Can't allocate more memory than page size, trying to allocate ${size} with a page size of ${this.pageSize}`);
        }

        let generator = this.getPagesWithEnoughSpace(size);
        for (let done = false, value = false;
            ({
                value,
                done
            } = generator.next()) && !done;) {
            let place = value.alloc(size);

            if (place !== false) {
                return place;
            }
        }

        // Impossible to reach.
        // or a new page will be spawned or
        // an error that a new page can't be spawned
    }

    /**
     * Free allocated memory
     *
     * @param {Number} pageIndex
     * @param {Number} offset
     * @param {Number} size
     */
    free(pageIndex, offset, size) {
        this.pages[pageIndex].free(offset, size);
    }

    /**
     * Allocate space for given type
     *
     * @param {function(new:IType)} type
     * @return {MemoryPosition|null}
     */
    allocType(type) {
        // 4 is a safe assumption
        const modulo = type.modulo || 4;
        const worstSize = type.size + modulo - 1;

        return this.alloc(worstSize);
    }

    /**
     * Create given `type` on this memory manager
     *
     * @param {function(new:IType)} type
     * @return {IType}
     */
    createType(type) {
        let place = this.allocType(type);

        return place.spawn(type);
    }

    /**
     *
     * @param {Number} pageIndex
     * @param {Number} offset
     * @param {Number} size
     * @return {MemoryPosition}
     */
    getPosition(pageIndex, offset, size) {
        return this.pages[pageIndex].getPosition(offset, size);
    }

    /**
     * Get all pages with at least `size` bytes free
     *
     * @param {Number} size
     * @yields {MemoryPage}
     */
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

try {
    if (module) {
        module.exports = {
            MemoryManager: MemoryManager,
            MemoryPage: MemoryPage,
            MemoryGap: MemoryGap,
            splitZoomBetween: splitZoomBetween,
            IType: IType,
        };
    }
} catch (e) {}
