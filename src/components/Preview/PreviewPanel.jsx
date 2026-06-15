import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { generateBlocks, paginate } from '../../utils/paginator';
import CVPage from './CVPage';
import BlockRenderer from './BlockRenderer';
import { Button } from "@/components/ui/button";

export default function PreviewPanel({ cvData, locale, onUndo, onRedo, canUndo, canRedo }) {
  const measureRef = useRef(null);
  const [pages, setPages] = useState([]);

  const meta = cvData.meta;

  const { blocks, allItems } = useMemo(() => {
    const sectionBlocks = generateBlocks(cvData, locale);
    const headerBlock = {
      type: 'cv-header',
      key: 'cv-header',
      sectionId: '__header__',
      data: { meta, locale },
    };
    return { blocks: sectionBlocks, allItems: [headerBlock, ...sectionBlocks] };
  }, [cvData, locale, meta]);

  const recompute = useCallback(() => {
    const container = measureRef.current;
    if (!container) return;
    const children = container.children;
    if (children.length < 2) return;

    const ruler = children[children.length - 1];
    if (!ruler.classList.contains('page-ruler')) return;

    const pixelsPerPage = ruler.offsetHeight;

    // Header's total vertical space: from its border-top to next element's border-top
    const headerH = children.length > 2
      ? children[1].offsetTop - children[0].offsetTop
      : children[0].offsetHeight;

    const heights = [];
    for (let i = 1; i < children.length - 1; i++) {
      const curr = children[i];
      const next = children[i + 1];
      const top = curr.offsetTop;
      const nextTop = next.offsetTop;
      heights.push(nextTop - top);
    }

    const computed = paginate(blocks, heights, pixelsPerPage, headerH);
    if (computed.length && computed[0].length) {
      computed[0].unshift(allItems[0]);
    }
    setPages(computed);
  }, [blocks, allItems]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  useEffect(() => {
    const onResize = () => recompute();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [recompute]);

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 px-5 py-3 border-b border-outline-variant bg-surface-dim/95 backdrop-blur">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-on-surface">Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
          >
            Forward
          </Button>
        </div>
      </div>

      <div ref={measureRef} className="measure-container" aria-hidden="true">
        {allItems.map((b) => (
          <BlockRenderer key={b.key} block={b} />
        ))}
        <div className="page-ruler" />
      </div>
      <div className="preview-panel">
        {pages.map((pageBlocks, i) => (
          <div key={i} className="print-page-wrapper">
            <CVPage blocks={pageBlocks} meta={meta} locale={locale} />
            {i < pages.length - 1 && (
              <div className="page-separator">
                <span className="page-separator-label">Page {i + 1}</span>
                <div className="page-separator-line" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
