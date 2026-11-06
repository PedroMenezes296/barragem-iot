interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pages, total, pageSize, onPageChange }: PaginationProps) {
  if (!total) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const visiblePages = Array.from({ length: Math.min(pages, 5) }, (_, index) => start + index);
  return <div className="pager"><span className="lab">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}</span><div><button disabled={page === 1} onClick={() => onPageChange(page - 1)} aria-label="Página anterior">‹</button>{visiblePages.map((number) => <button key={number} aria-current={number === page ? "page" : undefined} onClick={() => onPageChange(number)}>{number}</button>)}<button disabled={page === pages} onClick={() => onPageChange(page + 1)} aria-label="Próxima página">›</button></div></div>;
}
