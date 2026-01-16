import { WatchedList } from '@/core/watched-list';
import type { PackageHistory } from '../package-history';

export class PackageHistoryList extends WatchedList<PackageHistory> {
  compareItems(a: PackageHistory, b: PackageHistory): boolean {
    return a.id.equals(b.id);
  }
}
