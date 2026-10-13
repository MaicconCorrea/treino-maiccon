-- Dados iniciais da especificação (seções 3.6 e 3.7). Rodado uma vez em 13/10/2026.
do $$
declare
  uid uuid := (select id from auth.users order by created_at limit 1);
  rx uuid;
begin
  update public.profiles set nome = 'Maiccon', altura_cm = 184, objetivo = 'Recomposição: perder gordura e ganhar massa'
  where id = uid;

  insert into public.bioimpedance (user_id, data, peso, gordura_kg, pgc, mme, mlg, imc) values
    (uid, '2025-06-13', 141.3, 59.8, 42.3, 46.8, 81.5, 41.7),
    (uid, '2025-08-21', 130.9, 48.5, 37.0, 47.3, 82.4, 38.7),
    (uid, '2025-10-23', 121.8, 34.0, 27.9, 50.5, 87.8, 36.0),
    (uid, '2025-12-26', 116.5, 27.8, 23.8, 51.1, 88.7, 34.4),
    (uid, '2026-02-26', 111.6, 26.0, 23.3, 49.4, 85.6, 33.0),
    (uid, '2026-04-30', 106.2, 18.9, 17.8, 50.0, 87.3, 31.4),
    (uid, '2026-07-24', 106.1, 18.0, 17.0, 50.7, 88.1, 31.3)
  on conflict (user_id, data) do nothing;
  insert into public.bioimpedance (user_id, data, peso, gordura_kg, pgc, mme, mlg, imc, tmb, agua_l, proteina_kg, minerais_kg)
  values (uid, '2026-09-17', 101.0, 16.6, 16.5, 48.7, 84.4, 29.8, 2192, 61.5, 16.8, 6.11)
  on conflict (user_id, data) do nothing;

  insert into public.prescriptions (user_id, data, medico)
  values (uid, '2026-09-17', 'Dr. José Victor Rosa') returning id into rx;

  insert into public.protocol_items (user_id, prescription_id, receita_data, horario, item, dose, doses_total, inicio_uso, dias_por_dose)
  select uid, rx, '2026-09-17', h, i, d, t, '2026-09-17', dd
  from (values
    ('Ao acordar','Kelp iodine','700 mcg',60,1),
    ('Ao acordar','Cocoabuterol','50 mg',60,1),
    ('Ao acordar','Espironolactona','70 mg',60,1),
    ('Ao acordar','Ioimbina','10 mg',60,1),
    ('Ao acordar','Alopurinol','300 mg',60,1),
    ('Ao acordar','Citrato de clomifeno','30 mg',60,1),
    ('Ao acordar','Actrisave','200 mg',60,1),
    ('Ao acordar','Coenzima Q10','70 mg',60,1),
    ('Ao acordar','Urolitina A','70 mg',60,1),
    ('Ao acordar','Vitamina D3','20.000 UI',60,1),
    ('Ao acordar','Vitamina K2 MK7','140 mcg',60,1),
    ('Ao acordar','Cafeína anidra','170 mg',60,1),
    ('Ao acordar','Taurina','500 mg',60,1),
    ('Ao acordar','Tirosina','500 mg',60,1),
    ('Ao acordar','Tamoxifeno','20 mg',60,1),
    ('Junto à refeição','Clonapure','2,5 g',60,1),
    ('1x por semana','Cabergolina','0,5 mg',8,7),
    ('14h','Bupropiona','80 mg',60,1),
    ('14h','Naltrexona','8 mg',60,1),
    ('14h','Complexo C','500 mg',60,1),
    ('14h','Cromminex','10 mg',60,1),
    ('14h','Serenzo','100 mg',60,1),
    ('Jantar','Melatonina','3,5 mg',60,1),
    ('Jantar','5-HTP','150 mg',60,1),
    ('Jantar','Pro Sleep','130 mg',60,1),
    ('Jantar','Metilfolato','1,0 mg',60,1),
    ('Jantar','Metilcobalamina','1,0 mg',60,1),
    ('Jantar','Vitamina E','500 UI',60,1),
    ('Jantar','Anastrozol','0,1 mg',60,1),
    ('Jantar','Citrato de clomifeno','30 mg',60,1),
    ('Jantar','Zinco quelado','30 mg',60,1),
    ('Jantar','Magnésio glicina','500 mg',60,1)
  ) as v(h, i, d, t, dd);
end $$;
