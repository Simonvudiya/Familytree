-- Seed data for development

-- Create a demo family
INSERT INTO families (id, name, description, created_by, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'The Sambuli Family',
  'Preserving the legacy of Timothy Lirova Sambuli and descendants',
  (SELECT id FROM auth.users LIMIT 1),
  '{"allow_member_invite": true, "require_approval": false, "default_member_role": "contributor", "visibility": "family"}'::jsonb
) ON CONFLICT DO NOTHING;

-- Add demo people (Timothy Lirova Sambuli's family)
INSERT INTO people (id, family_id, created_by, name, slug, sex, birth_date, birth_place, death_date, death_place, bio, is_living, generation)
VALUES
-- Timothy Lirova Sambuli
('11111111-1111-1111-1111-111111111111'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Timothy Lirova Sambuli', 'timothy-lirova-sambuli', 'male', '1938-01-01', 'East Busali, Itegero Sub-Location, Ikobero Village', NULL, NULL,
 'Born in 1938 in East Busali, Itegero Sub-Location, Ikobero Village. Son of Zakayo Lirova and Miriam Musimbi. Belongs to the Avasali clan, Vamageza lineage. Served as Young Soldier (1952) and full soldier (1968). Worked at Lenard Moore Company (1962-1972) and Silent Night until retirement in 1993. Married Susy Iminza (1967) and later Beres Maraga Florence (1978). Father of 9 children. Devoted Christian leader.',
 FALSE, 1),
-- Susy Iminza (first wife)
('11111111-1111-1111-1111-111111111112'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Susy Iminza', 'susy-iminza', 'female', '1945-01-01', 'Kenya', NULL, NULL,
 'First wife of Timothy Lirova Sambuli. Married on 7 January 1967. Mother of Roselyne, Fredrick, and Maureen.',
 FALSE, 1),
-- Beres Maraga Florence (second wife)
('11111111-1111-1111-1111-111111111113'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Beres Maraga Florence', 'beres-maraga-florence', 'female', '1955-01-01', 'Kenya', NULL, NULL,
 'Second wife of Timothy Lirova Sambuli. Married in 1978. Mother of Lenard, Elphas, Godfrey, George, Simon, and Sharon.',
 TRUE, 1),
-- Children from first marriage
('22222222-2222-2222-2222-222222222221'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Roselyne Mugasia', 'roselyne-mugasia', 'female', '1968-01-01', 'Kenya', NULL, NULL, 'Daughter of Timothy and Susy.', TRUE, 2),
('22222222-2222-2222-2222-222222222222'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Fredrick Lirova', 'fredrick-lirova', 'male', '1970-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Susy.', TRUE, 2),
('22222222-2222-2222-2222-222222222223'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Maureen Kaveza', 'maureen-kaveza', 'female', '1972-01-01', 'Kenya', NULL, NULL, 'Daughter of Timothy and Susy.', TRUE, 2),
-- Children from second marriage
('22222222-2222-2222-2222-222222222224'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Lenard Lingalio Lirova', 'lenard-lingalio-lirova', 'male', '1979-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Beres.', TRUE, 2),
('22222222-2222-2222-2222-222222222225'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Elphas Lirova', 'elphas-lirova', 'male', '1981-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Beres.', TRUE, 2),
('22222222-2222-2222-2222-222222222226'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Godfrey Miheso Lirova', 'godfrey-miheso-lirova', 'male', '1983-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Beres.', TRUE, 2),
('22222222-2222-2222-2222-222222222227'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'George Lidede Lirova', 'george-lidede-lirova', 'male', '1985-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Beres.', TRUE, 2),
('22222222-2222-2222-2222-222222222228'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Simon Vudiya Lirova', 'simon-vudiya-lirova', 'male', '1987-01-01', 'Kenya', NULL, NULL, 'Son of Timothy and Beres.', TRUE, 2),
('22222222-2222-2222-2222-222222222229'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Sharon Malongo Lirova', 'sharon-malongo-lirova', 'female', '1989-01-01', 'Kenya', NULL, NULL, 'Daughter of Timothy and Beres.', TRUE, 2)
ON CONFLICT DO NOTHING;

-- Relationships
INSERT INTO relationships (family_id, person_id, related_person_id, type)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'spouse'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'timothy-lirova-sambuli' AND p2.slug = 'susy-iminza'
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'spouse'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'timothy-lirova-sambuli' AND p2.slug = 'beres-maraga-florence'
UNION ALL
-- Children of Timothy and Susy
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'child'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'timothy-lirova-sambuli' AND p2.slug IN ('roselyne-mugasia', 'fredrick-lirova', 'maureen-kaveza')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'child'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'susy-iminza' AND p2.slug IN ('roselyne-mugasia', 'fredrick-lirova', 'maureen-kaveza')
UNION ALL
-- Children of Timothy and Beres
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'child'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'timothy-lirova-sambuli' AND p2.slug IN ('lenard-lingalio-lirova', 'elphas-lirova', 'godfrey-miheso-lirova', 'george-lidede-lirova', 'simon-vudiya-lirova', 'sharon-malongo-lirova')
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid, p1.id, p2.id, 'child'::relationship_type
FROM people p1, people p2
WHERE p1.slug = 'beres-maraga-florence' AND p2.slug IN ('lenard-lingalio-lirova', 'elphas-lirova', 'godfrey-miheso-lirova', 'george-lidede-lirova', 'simon-vudiya-lirova', 'sharon-malongo-lirova')
ON CONFLICT DO NOTHING;

-- Demo stories
INSERT INTO stories (id, family_id, author_id, title, slug, content, excerpt, status, visibility, tags, word_count, reading_time)
VALUES
('33333333-3333-3333-3333-333333333331'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'The Life of Timothy Lirova Sambuli', 'the-life-of-timothy-lirova-sambuli',
 '# The Life of Timothy Lirova Sambuli

 ## Early Life and Birth

 I, **Timothy Lirova Sambuli**, was born in **1938** in **East Busali, Itegero Sub-Location, Ikobero Village**. I am the son of the late **Zakayo Lirova** and the late **Miriam Musimbi**.

 I belong to the **Avasali clan**, in the **Vamageza lineage**. I am an uncle to the **Vakizungu**, in the **Varielo lineage**.

 We were eight children in our family...

 ## Military Service

 I was dedicated in **1938** by **Lieutenant Kanyara**. In **1952**, I was appointed a **Young Soldier** by **Captain Kisibo**.

 In **1968**, I was sworn in as a **full soldier** by **Major Mwololo**.

 ## Education

 I began my education at **Ikobero School** in **1952** and studied there until **1955**. I sat for the **Common Entrance Examination (CEE)**.

 In **1956**, I joined **Busali Intermediate School**, where I studied until **1959**. I sat for the **Kenya Preliminary Examination (KPE)**.

 ## Career

 In **1962**, I joined the **Lenard Moore Company**, where I worked as a trainer for four years. I continued working with the company until **1972**, when I worked as a technician, referred to in my records as **"Afostry."**

 The company was later sold to **Silent Night**, where I continued working until I retired in **1993**.

 After my retirement in 1993, I returned to my farm, which I had purchased in **1972**. I engaged in **farming and business**.

 ## Family

 On **7 January 1967**, I married **Susy Iminza**. We were blessed with three children...

 In **1978**, I married **Beres Maraga Florence**. We were blessed with six children...',
 'The autobiography of Timothy Lirova Sambuli (1938-2024), chronicling his life from East Busali to his military service, career, and family.',
 'published'::story_status, 'family'::story_visibility, ARRAY['autobiography', 'biography', 'kenya', 'family-history'], 1250, 5),
('33333333-3333-3333-3333-333333333332'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Our Family Origins in Ikobero', 'our-family-origins-in-ikobero',
 '# Our Family Origins in Ikobero

 The Sambuli family traces its roots to **Ikobero Village** in **East Busali**, within the **Itegero Sub-Location** of Western Kenya.

 ## The Avasali Clan

 Our family belongs to the **Avasali clan**, specifically the **Vamageza lineage**. This clan affiliation connects us to a wider network of families across the region.

 ## The Vakizungu Connection

 Timothy Lirova Sambuli is an uncle to the **Vakizungu** family, in the **Varielo lineage**. This relationship highlights the interconnected nature of our community.

 ## Eight Siblings

 Timothy was one of eight children born to Zakayo Lirova and Miriam Musimbi:

 1. Reuben Kellam Lirova
 2. Zablon Ihugangwa Lirova
 3. Nathern Matanye Lirova
 4. **Timothy Sambuli Lirova**
 5. Cliff Mudasia Lirova
 6. Eunice Mmaitsi Lirova
 7. Rhoda Kihonji Lirova
 8. Doris Mbayaji Lirova

 Each of these siblings went on to build their own families, creating a vast network of descendants who now span across Kenya and beyond.',
 'Exploring the clan lineage and family origins of the Sambuli family in Ikobero Village, Western Kenya.',
 'published'::story_status, 'family'::story_visibility, ARRAY['genealogy', 'clan', 'lineage', 'kenya'], 850, 4)
ON CONFLICT DO NOTHING;

-- Link stories to people
INSERT INTO story_people (story_id, person_id, relationship)
SELECT '33333333-3333-3333-3333-333333333331'::uuid, id, 'subject' FROM people WHERE slug = 'timothy-lirova-sambuli'
UNION ALL
SELECT '33333333-3333-3333-3333-333333333332'::uuid, id, 'subject' FROM people WHERE slug = 'timothy-lirova-sambuli'
ON CONFLICT DO NOTHING;

-- Demo timeline events
INSERT INTO timeline_events (id, family_id, created_by, title, description, date, event_type, significance, tags)
VALUES
('44444444-4444-4444-4444-444444444441'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Birth of Timothy Lirova Sambuli', 'Born in East Busali, Itegero Sub-Location, Ikobero Village to Zakayo Lirova and Miriam Musimbi', '1938-01-01', 'birth', 'milestone', ARRAY['birth', 'founder']),
('44444444-4444-4444-4444-444444444442'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Appointed Young Soldier', 'Appointed by Captain Kisibo', '1952-01-01', 'military', 'personal', ARRAY['military', 'youth']),
('44444444-4444-4444-4444-444444444443'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Circumcision (Sirula age-set)', 'Underwent circumcision and joined the Sirula age-set', '1952-01-01', 'custom', 'milestone', ARRAY['tradition', 'coming-of-age']),
('44444444-4444-4444-4444-444444444444'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Sworn in as Full Soldier', 'Sworn in by Major Mwololo', '1968-01-01', 'military', 'milestone', ARRAY['military', 'career']),
('44444444-4444-4444-4444-444444444445'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Joined Lenard Moore Company', 'Started as a trainer', '1962-01-01', 'career', 'personal', ARRAY['career', 'employment']),
('44444444-4444-4444-4444-444444444446'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Marriage to Susy Iminza', 'Married on 7 January 1967', '1967-01-07', 'marriage', 'milestone', ARRAY['marriage', 'family']),
('44444444-4444-4444-4444-444444444447'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Purchased Family Farm', 'Bought farm property', '1972-01-01', 'achievement', 'milestone', ARRAY['property', 'investment']),
('44444444-4444-4444-4444-444444444448'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Marriage to Beres Maraga Florence', 'Married in 1978', '1978-01-01', 'marriage', 'milestone', ARRAY['marriage', 'family']),
('44444444-4444-4444-4444-444444444449'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Retirement from Silent Night', 'Retired after career at Lenard Moore/Silent Night', '1993-01-01', 'career', 'milestone', ARRAY['retirement', 'career']),
('44444444-4444-4444-4444-444444444450'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1),
 'Returned to Farming and Business', 'Post-retirement activities on family farm', '1993-01-01', 'career', 'personal', ARRAY['farming', 'business'])
ON CONFLICT DO NOTHING;

-- Link timeline events to Timothy
INSERT INTO timeline_event_people (event_id, person_id)
SELECT id, (SELECT id FROM people WHERE slug = 'timothy-lirova-sambuli')
FROM timeline_events
WHERE family_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Demo memories
INSERT INTO memories (family_id, author_id, person_id, title, content, memory_type, date, tags)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1), id,
  'My Father''s Wisdom', 'My father always said: "Education is the one thing no one can take away from you." He valued learning above all else.', 'quote'::memory_type, '1970-01-01', ARRAY['wisdom', 'education', 'quote']
FROM people WHERE slug = 'fredrick-lirova'
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1), id,
  'Sunday Family Gatherings', 'Every Sunday after church, the whole extended family would gather at our grandparents'' homestead for a shared meal. The children would play while the elders discussed family matters.', 'tradition'::memory_type, NULL, ARRAY['tradition', 'family', 'sunday', 'church']
FROM people WHERE slug = 'lenard-lingalio-lirova'
UNION ALL
SELECT '00000000-0000-0000-0000-000000000001'::uuid, (SELECT id FROM auth.users LIMIT 1), id,
  'Grandmother''s Ugali Recipe', 'The secret to perfect ugali is to stir continuously with a wooden mwiko (stick) and never let it form lumps. My grandmother taught me this when I was ten.', 'recipe'::memory_type, NULL, ARRAY['recipe', 'ugali', 'cooking', 'grandmother']
FROM people WHERE slug = 'roselyne-mugasia'
ON CONFLICT DO NOTHING;