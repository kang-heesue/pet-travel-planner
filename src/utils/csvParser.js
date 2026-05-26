// CSV 데이터 파싱
export const parseCSV = (text) => {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) return [];

  const list = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // 쉼표 분할 (큰따옴표 내부 쉼표 무시)
    const row = [];
    let insideQuote = false;
    let entry = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());

    // 데이터 최소 요건 미달 스킵
    if (row.length < 6) continue;

    // 지역명 정규화
    const normalizeRegionName = (name, addrStr) => {
      if (!name) return '';
      let trimmed = name.trim();
      let addr = (addrStr || '').trim();

      // 광역시도 단위 통합
      if (addr.startsWith('부산') || trimmed.includes('부산')) return '부산';
      if (addr.startsWith('서울') || trimmed.includes('서울')) return '서울';
      if (addr.startsWith('인천') || trimmed.includes('인천')) return '인천';
      if (addr.startsWith('대전') || trimmed.includes('대전')) return '대전';
      if (addr.startsWith('대구') || trimmed.includes('대구')) return '대구';
      if (addr.startsWith('광주') || trimmed.includes('광주')) return '광주';
      if (addr.startsWith('울산') || trimmed.includes('울산')) return '울산';
      if (addr.startsWith('세종') || trimmed.includes('세종')) return '세종';
      if (addr.startsWith('제주') || trimmed.includes('제주')) return '제주';

      trimmed = trimmed
        .replace(/광역시$/, '')
        .replace(/특별시$/, '')
        .replace(/특별자치도$/, '')
        .replace(/특별자치시$/, '');
      if (
        trimmed.length >= 3 &&
        (trimmed.endsWith('시') || trimmed.endsWith('군'))
      ) {
        trimmed = trimmed.slice(0, -1);
      }
      return trimmed;
    };

    const placeName = row[0].replace(/^"|"$/g, '');
    const rawRegion = row[1].replace(/^"|"$/g, '');
    const address = row[2].replace(/^"|"$/g, '');
    const region = normalizeRegionName(rawRegion, address);
    const categoryType = row[3].replace(/^"|"$/g, '');
    const lat = parseFloat(row[4]);
    const lng = parseFloat(row[5]);
    const phone = row[6] ? row[6].replace(/^"|"$/g, '') : '';
    const homepage = row[7] ? row[7].replace(/^"|"$/g, '') : '';
    const petLimit = row[8] ? row[8].replace(/^"|"$/g, '') : '';

    if (isNaN(lat) || isNaN(lng)) continue; // 유효하지 않은 좌표 제외

    // 카테고리 매핑
    let mappedCategory = 'tourist';
    if (categoryType.includes('식당') || categoryType.includes('카페')) {
      mappedCategory =
        placeName.includes('카페') ||
        placeName.includes('다방') ||
        placeName.includes('커피')
          ? 'cafe'
          : 'restaurant';
    } else if (
      categoryType.includes('숙소') ||
      categoryType.includes('펜션') ||
      categoryType.includes('호텔')
    ) {
      mappedCategory = 'hotel';
    }

    list.push({
      id: `csv-place-${i}`,
      name: placeName,
      region: region,
      address: address,
      category: mappedCategory,
      lat: lat,
      lng: lng,
      phone: phone || '정보 없음',
      homepage: homepage,
      pet_rule: petLimit
        ? `${petLimit} 동반 가능`
        : '모든 크기 반려견 동반 입장 가능',
      description: `${region}에 있는 고품격 ${categoryType} 명소입니다. 소중한 반려견과 함께 행복한 추억을 설계해 보세요.`,
      open_hours:
        mappedCategory === 'hotel'
          ? '체크인 15:00 / 아웃 11:00'
          : mappedCategory === 'restaurant'
            ? '11:30 - 21:00'
            : '10:00 - 22:00',
    });
  }
  return list;
};
