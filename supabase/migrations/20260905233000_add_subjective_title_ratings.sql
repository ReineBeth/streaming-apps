-- Store subjective personal ratings while keeping the original numeric column backward compatible.
alter table public.user_titles
  add column if not exists rating_label text;

alter table public.user_titles
  drop constraint if exists user_titles_rating_label_check;

alter table public.user_titles
  add constraint user_titles_rating_label_check
  check (rating_label is null or rating_label in ('bad', 'okay', 'good', 'very_good', 'masterpiece'));

alter table public.user_titles
  drop constraint if exists user_titles_rating_label_watched_check;

alter table public.user_titles
  add constraint user_titles_rating_label_watched_check
  check (status = 'watched' or rating_label is null);

update public.user_titles
set rating_label = case
  when rating >= 4.5 then 'masterpiece'
  when rating >= 3.5 then 'very_good'
  when rating >= 2.5 then 'good'
  when rating >= 1.5 then 'okay'
  else 'bad'
end
where rating is not null and status = 'watched' and rating_label is null;
