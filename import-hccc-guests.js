const fs = require('fs');
const { Client } = require('pg');

const env = fs.readFileSync('.env.local', 'utf8');
const dbUrlMatch = env.match(/DATABASE_URL="([^"]+)"/);
if (dbUrlMatch) {
  process.env.DATABASE_URL = dbUrlMatch[1];
}

const rawGuestList = `1. Benjamin Lela
2. Thelma Chingeya
3. Nomvula Chingeya
4. Zibusiso Khupe
5. Nathaniel Mhlanga
6. Sheilla Makumborenga
7. Darcica Panashe Chihava 1
8. Darcica Panashe Chihava 2
9. Tatenda Nyabasa
10. Sympathy Mutandiri
11. Methembe Brave
12. Mthokozisi Ncube
13. Tecla Moyo
14. Obey Muchechesi
15. Phillip Muchechesi
16. Nyash Muchechesi
17. Rufaro Mapingire
18. Anotidaishe Zinyau
19. Davis Divine Ncube
20. Zibusiso Mkandla
21. Handsome Ndlovu
22. Tinevimbo Zengeni
23. Ruth Rumbidzai Ndoora
24. Effort Dube
25. Lindiwe Nyathi
26. Rutendo Njara
27. Charmaine Chinowaita
28. Careen Magwai 1
29. Clittny Chidzvete
30. Sophia Chikwanda
31. Ruwarashe Tengwa
32. Edwina Munzara
33. Tino Chitondo
34. Davidzo Mauzavazi
35. Tatenda Kwashira
36. Anotidaishe Majaya
37. Leeroy Karungura
38. Tatenda Ngodo
39. Justice Chavunduka
40. Takudzwa Mazvimba
41. Glady Gomo
42. Paida
43. Plaxedes Muvuti
44. Trish Katyokera
45. Ruth Mataro
46. Miriraishe Zunza
47. Marborne Mufaro Phiri
48. Shamiso Kamukono
49. Shumirai Kamukono
50. Malvern Kachidza
51. Evans Madziwa
52. Tinatsei Nyoni
53. Takudzwa Maruva
54. Kudzai Runhare
55. Tiwirayi Maruva
56. Nessie Zvawashe
57. Alice Nyazombe
58. Juliana Jhakazi
59. Tsitsidzaishe Kunonga
60. Pick n pay
61. Adelyne Mahachi
62. Natashia Kutseza
63. Choice Machokoto
64. Cathrina Marowatsanga
65. Merit Dube
66. Bridget Chikada
67. Ruvarashe Chikada
68. Sethule Nkiwane
69. Martha Mashinge
70. Deliwe Natasha Zimani
71. Freedom Mutarah
72. Ashel Anotida Mutema
73. Alicia Masarira
74. Simbarashe Tinago
75. Ruth Banda
76. Tinodaishe Maoko
77. Francisca Bako
78. Lungelwe Dhlamini
79. Stulisiwe Cheu
80. Elijah Homela
81. Moreblessing Masuka
82. Ntandoyenkosi Nyengera
83. Diana Mtshiya
84. Joseph Dushimimana
85. Noella Ziana
86. Senzile Ncube
87. Sicelokuhle Masikize
88. Sizo Mpofu
89. Fortune Mazvimba
90. Khanyisile Mhlanga
91. Ensureplus
92. Gugulethu Ndlovu
93. Tinashe Risinamhodzi
94. Persly Jeche
95. Rutendo Chiwanga
96. Paida Chantel Chikwanha
97. Sibusisiwe Moyo
98. Simbisai Munjanja
99. Michelle Mutambashora
100. Columbustine Mandizvidza
101. Tatenda Mitchelle Dzaramba
102. Monalisa Hamawana
103. Brenda Musengi
104. Ruvimbo Kwenda
105. Doreen Homerai
106. Lawson Daure
107. Kiara Dube
108. Kundai Kudinha
109. Delight Mandina
110. Tadiwa Mandina
111. Nomathamsanqa Gumede
112. Munashe Matambo
113. Tafadzwa Matambo
114. Blessing Nyamutswa
115. Tadiwa Kasvairo
116. Richmore Chafuruka
117. Tinayeishe Kayitano
118. Andile Nyoni
119. Belinda Mthombeni
120. Tina Nyathi
121. Mthabisi Moyo
122. Leeroy Magwaza
123. Takunda Magwaza
124. Kundai Magama
125. Denzel Jiyane
126. Rutendo Taruwinga
127. Vanessa Mutema
128. Hope Maponde
129. Princess Mabhena
130. Shamiso Madziwana
131. Mutsawashe Magara
132. Varaidzo Nhokwra
133. Joseph Washaya
134. Natasha Sibanda
135. Careen Magwai 2
136. Pamela Shambare
137. Mandla Maposa
138. Justice Chirinda
139. Tashinga Dhliwayo
140. Yvonne Madhimbu
141. Melissa Madya
142. Wayne Bhomani
143. Huggins Chidanho
144. Tafadzwa Tsoka
145. Benaiah Mdzingwa Mudzingwa
146. Plus 1
147. Rutendo Muchairi
148. Rumbidzai Muchairi
149. Chris Zvavahera
150. Samantha Mgwata
151. Evelyn Sammantha Kureya
152. Shylet Madzikwa
153. Gamuchirai Mabika
154. Theophilus Dube
155. Munashe Chavhure
156. Trish Manyanye
157. Busani Ndhlovu
158. Anele Dube
159. Cynthia Mahachi
160. Anotida Mutiti
161. Chantelle Marino
162. Tsitsi Chimutingiza
163. Nicole Mumbamarwo
164. Shamiso Madziwani
165. Ntando Nxumalo
166. Bongani Bungu
167. Shanandrah
168. Oline Chiduku
169. Samantha
170. Bongani
171. Panashe Maposa
172. Nozithelo Ngwenya
173. Melusi Nsingo
174. Alice Mlambo
175. Rejoice Salim
176. Tatenda Musora
177. Paidamoyo Chapeyama
178. Tariro Kachingwe
179. Tatenda Motsi
180. Nyasha Chihwayi
181. Amanda Madawo
182. Unconfirmed 1 - paid
183. Unconfirmed 2 - paid
184. Unconfirmed 3 - paid
185. Unconfirmed 4 - paid
186. Unconfirmed 5 - paid
187. Chiedza Goronga
188. Sibusisiwe Dhlodhlo
189. Thendo Sibanda
190. Micheal Phonela
191. Martin Phonela
192. Alyce Andson
193. Tinashe Zana
194. Nickson Mukuwiri
195. Brandon Amini
196. Dereck Mukarati
197. Farirai Kandemiiri
198. Tracey Ruzengwe
199. Brandon Tengwa
200. Ayan Manjonjori
201. Tadiwa Ganagana
202. Tanatswa Chivasa
203. Yolanda Manyenga
204. Panashe Maphosa
205. Rumbidzai Rupere
206. Chido Moyo
207. Tino - Kuguta farm
208. Tadiwa - Kuguta farm
209. Natalie Kadiki
210. Nothando Maphosa
211. Brave Zhou
212. Godfrey Mero
213. Munashe Mupambawashe
214. Pride Kuguta Farm
215. Alex Chakandiona
216. Ntabiso Muleya
217. Nothando Savanhu`;

async function importGuests() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const eventId = '78a5e4f1-c037-46b0-b70d-1b6888366bb3';
    const chairsPerTable = 10;
    
    const guests = rawGuestList.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log("Found " + guests.length + " guests to insert.");
    
    for (let i = 0; i < guests.length; i++) {
      // Remove the "1. " or "217. " prefix
      let name = guests[i].replace(/^\d+\.\s*/, '');
      const parts = name.split(' ');
      const first_name = parts[0] || 'Unknown';
      const last_name = parts.slice(1).join(' ') || '';
      const table_number = Math.floor(i / chairsPerTable) + 1;
      
      const query = {
        text: 'INSERT INTO guests(event_id, first_name, last_name, table_number) VALUES($1, $2, $3, $4)',
        values: [eventId, first_name, last_name, table_number],
      };
      await client.query(query);
    }

    console.log("All guests imported successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

importGuests();
