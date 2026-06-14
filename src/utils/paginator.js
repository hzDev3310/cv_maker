function formatDateRange(dr, locale) {
  if (!dr) return '';
  const start = dr.start || '';
  if (dr.isOngoing) {
    return start ? `${start} – Present` : 'Present';
  }
  return dr.end ? `${start} – ${dr.end}` : start || '';
}

export function generateBlocks(cvData, locale) {
  const blocks = [];
  const sections = (cvData.sections || []).filter(s => s.visible !== false);

  for (const section of sections) {
    const sid = section.id || `s-${blocks.length}`;
    const title = section.title?.[locale] || section.title?.en || '';

    blocks.push({
      type: 'section-header', key: `${sid}-h`, sectionId: sid,
      data: { title },
    });

    const items = section.items || [];

    switch (section.type) {
      case 'text':
        for (const item of items) {
          blocks.push({
            type: 'summary', key: `${sid}-txt`, sectionId: sid,
            data: { content: item.content?.[locale] || item.content?.en || '' },
          });
        }
        break;

      case 'experience':
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          const ik = `${sid}-e${ii}`;
          blocks.push({
            type: 'experience-header', key: `${ik}-hd`, sectionId: sid, itemId: ik,
            data: {
              role: item.role?.[locale] || item.role?.en || '',
              organization: item.organization || '',
              location: item.location?.[locale] || '',
              date: formatDateRange(item.dateRange, locale),
            },
          });
          const bullets = item.bullets?.[locale] || item.bullets?.en || [];
          for (let bi = 0; bi < bullets.length; bi++) {
            blocks.push({
              type: 'bullet', key: `${ik}-b${bi}`, sectionId: sid, itemId: ik,
              isFirstBullet: bi === 0,
              data: { text: bullets[bi] },
            });
          }
          if (item.tags?.length) {
            blocks.push({
              type: 'tags', key: `${ik}-tg`, sectionId: sid, itemId: ik,
              data: { tags: item.tags },
            });
          }
        }
        break;

      case 'project':
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          const ik = `${sid}-p${ii}`;
          blocks.push({
            type: 'project-header', key: `${ik}-hd`, sectionId: sid, itemId: ik,
            data: {
              name: item.nameLocalized?.[locale] || item.name || '',
              subtitle: item.subtitle?.[locale] || '',
              date: formatDateRange(item.dateRange, locale),
            },
          });
          const bullets = item.bullets?.[locale] || item.bullets?.en || [];
          for (let bi = 0; bi < bullets.length; bi++) {
            blocks.push({
              type: 'bullet', key: `${ik}-b${bi}`, sectionId: sid, itemId: ik,
              isFirstBullet: bi === 0,
              data: { text: bullets[bi] },
            });
          }
          if (item.techStack?.length) {
            blocks.push({
              type: 'tags', key: `${ik}-tg`, sectionId: sid, itemId: ik,
              data: { tags: item.techStack },
            });
          }
        }
        break;

      case 'education':
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          const ik = `${sid}-ed${ii}`;
          blocks.push({
            type: 'education-header', key: `${ik}-hd`, sectionId: sid, itemId: ik,
            data: {
              degree: item.degree?.[locale] || item.degree?.en || '',
              institution: item.institution || '',
              location: item.location?.[locale] || '',
              date: formatDateRange(item.dateRange, locale),
            },
          });
          const notes = item.notes?.[locale] || item.notes?.en || [];
          for (let ni = 0; ni < notes.length; ni++) {
            blocks.push({
              type: 'bullet', key: `${ik}-n${ni}`, sectionId: sid, itemId: ik,
              isFirstBullet: ni === 0,
              data: { text: notes[ni] },
            });
          }
        }
        break;

      case 'skills':
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          blocks.push({
            type: 'skill-group', key: `${sid}-sk${ii}`, sectionId: sid,
            data: {
              category: item.category?.[locale] || item.category?.en || '',
              skills: item.skills || [],
            },
          });
        }
        break;

      case 'languages':
        for (let ii = 0; ii < items.length; ii++) {
          const item = items[ii];
          blocks.push({
            type: 'language', key: `${sid}-l${ii}`, sectionId: sid,
            data: {
              name: item.name?.[locale] || item.name?.en || '',
              level: item.level?.[locale] || '',
            },
          });
        }
        break;
    }
  }

  return blocks;
}

export function paginate(blocks, heights, pixelsPerPage, headerHeight) {
  if (!blocks.length) return [[]];

  const pages = [];
  let currentPage = [];
  let remaining = pixelsPerPage - headerHeight;

  for (let i = 0; i < blocks.length; i++) {
    const h = heights[i];
    if (h <= remaining + 1) {
      currentPage.push(blocks[i]);
      remaining -= h;
    } else {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [blocks[i]];
      remaining = pixelsPerPage - h;
      // If a non-first-bullet starts a new page, account for the <ul> margin
      if (blocks[i].type === 'bullet' && !blocks[i].isFirstBullet) {
        remaining -= 4;
      }
    }
  }

  if (currentPage.length > 0) pages.push(currentPage);

  // Post-process: fix orphan section headers
  for (let pi = 0; pi < pages.length - 1; pi++) {
    const page = pages[pi];
    const lastBlock = page[page.length - 1];
    const firstNext = pages[pi + 1][0];

    if (lastBlock.type === 'section-header' && firstNext) {
      const sameSection = lastBlock.sectionId === firstNext.sectionId;
      if (sameSection) {
        page.pop();
        pages[pi + 1].unshift(lastBlock);
      }
    }
  }

  const nonEmpty = pages.filter(p => p.length > 0);
  return nonEmpty.length > 0 ? nonEmpty : [[]];
}
