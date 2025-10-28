using { com.gov.librarymanagement as lb } from '../db/schema';

service libraryManagementService {
    entity Books as projection on lb.Books;
    entity BookCopies as projection on lb.BookCopies;
    entity Genres as projection on lb.Genres;
    entity Members as projection on lb.Members;
    entity BorrowingInfo as projection on lb.BorrowingInfo;

    action borrowBook(memberID: UUID, bookCopyID: UUID, borrowDate: Date, dueDate: Date) returns BorrowingInfo;
    action returnBook(borrowingID: UUID, returnDate: Date) returns BorrowingInfo;
    action getAvailableBooks() returns array of Books;
    action getOverdueBooks() returns array of BorrowingInfo;
    action getMemberBorrowingHistory(memberID: UUID) returns array of BorrowingInfo;
}
