export type BookStatus = 'unread' | 'in-progress' | 'finished'
export interface Book {
  id: string; fingerprint: string; contentHash?: string; duplicateGroup?: string; title: string; author: string; path: string; format: 'pdf' | 'epub';
  coverUrl?: string; addedAt: string; lastOpenedAt?: string; progress: number; position?: string;
  favorite: boolean; status: BookStatus; collectionIds: string[]; pageCount?: number;
}
export interface Bookmark { id: string; bookId: string; position: string; label: string; createdAt: string }
export interface Note { id: string; bookId: string; position: string; text: string; createdAt: string; updatedAt: string }
export interface Highlight { id: string; bookId: string; position: string; text: string; color: string; createdAt: string }
export interface Collection { id: string; name: string; createdAt: string }
export interface Session { id: string; bookId: string; startedAt: string; endedAt: string; minutes: number }
export interface Settings { folders: string[]; theme: 'light'|'sepia'|'dark'; dailyGoalMinutes: number; focusShelfLimit: number; focusShelf: string[] }
export interface AppData { books: Book[]; bookmarks: Bookmark[]; notes: Note[]; highlights: Highlight[]; collections: Collection[]; sessions: Session[]; settings: Settings }
export interface ReadLocalAPI {
  getData(): Promise<AppData>; chooseFolder(): Promise<string|null>; scanFolders(folders: string[]): Promise<Book[]>;
  updateBook(id: string, patch: Partial<Book>): Promise<Book>; saveSettings(patch: Partial<Settings>): Promise<Settings>;
  addBookmark(input: Omit<Bookmark,'id'|'createdAt'>): Promise<Bookmark>; removeBookmark(id: string): Promise<void>;
  addNote(input: Omit<Note,'id'|'createdAt'|'updatedAt'>): Promise<Note>; removeNote(id: string): Promise<void>;
  addHighlight(input: Omit<Highlight,'id'|'createdAt'>): Promise<Highlight>; removeHighlight(id: string): Promise<void>;
  addCollection(name: string): Promise<Collection>; removeCollection(id: string): Promise<void>; logSession(input: Omit<Session,'id'>): Promise<Session>;
  fileUrl(path: string): Promise<string>;
  onLibraryChanged(callback:()=>void):()=>void;
}
declare global { interface Window { readlocal: ReadLocalAPI } }
