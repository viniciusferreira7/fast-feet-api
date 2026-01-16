import { WatchedList } from './watched-list';

class NumberWatchedList extends WatchedList<number> {
  compareItems(a: number, b: number): boolean {
    return a === b;
  }
}

describe('Watched list', () => {
  it('should be able to create a watched list with initial items', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    expect(list.currentItems).toHaveLength(3);
  });

  it('should be able to add new items to list', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    list.add(4);
    list.add(5);

    expect(list.currentItems).toHaveLength(5);
    expect(list.getNewItems()).toEqual([4, 5]);
  });

  it('should be able to remove item to list', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    list.remove(3);

    expect(list.currentItems).toHaveLength(2);
    expect(list.getRemovedItems()).toEqual([3]);
  });

  it('should be able to add item even if item was removed before', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    list.remove(3);
    list.add(3);

    expect(list.currentItems).toHaveLength(3);
    expect(list.getNewItems()).toEqual([]);
    expect(list.getRemovedItems()).toEqual([]);
  });

  it('should be able to remove item even if item was added before', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    list.add(4);
    list.remove(4);

    expect(list.currentItems).toHaveLength(3);
    expect(list.getNewItems()).toEqual([]);
    expect(list.getRemovedItems()).toEqual([]);
  });

  it('should be able to update watched list items', () => {
    const list = new NumberWatchedList([1, 2, 3]);

    list.update([1, 3, 5]);

    expect(list.getNewItems()).toEqual([5]);
    expect(list.getRemovedItems()).toEqual([2]);
  });
});
