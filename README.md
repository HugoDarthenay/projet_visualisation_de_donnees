# Notre user targets

La variété des données de notre base offre une analyse qui semble pertinente pour plusieurs acteurs en lien avec notre sujet d’étude. Nous en avons distingué plusieurs pour lesquels une visualisation des données peut s’avérer nécessaire. 
Le corps médical pourrait avoir besoin de s’appuyer sur des visualisations de données dans le cadre de détection de cas atypiques et de patterns spécifiques chez les jeunes. L’entourage (famille) pourrait s’en servir pour un travail de comparaison entre l’échantillon étudié et leur cas personnel.
Dans notre cas, nous nous pencherons sur les besoins des équipes pédagogiques (éducation) qui pourraient faire appel à la visualisation de données afin d’analyser les comportements, définir les profils et bien d’autres.
# Dataset

| Nom de la colonne | Description | Type de donnée | Notes |
| :--- | :--- | :--- | :--- |
| **ID** | Identifiant unique pour chaque participant. | Entier | |
| **Name** | Nom du participant (anonymisé). | Texte | |
| **Age** | Âge du participant. | Entier | |
| **Gender** | Sexe/Genre du participant. | Catégorique | |
| **Location** | Localisation du participant. | Texte | |
| **School\_Grade** | Niveau scolaire du participant. | Catégorique | |
| **Daily\_Usage\_Hours** | Nombre total d'heures d'utilisation du téléphone par jour. | Flottant | En heures. |
| **Sleep\_Hours** | Nombre d'heures de sommeil par nuit. | Flottant | En heures. |
| **Academic\_Performance** | Score/Pourcentage de performance académique. | Entier | |
| **Social\_Interactions** | Nombre d'interactions sociales en personne par jour/semaine. | Entier | |
| **Exercise\_Hours** | Nombre d'heures d'activité physique par semaine. | Flottant | En heures. |
| **Anxiety\_Level** | Niveau d'anxiété ressenti. | Entier | Échelle de 1 (faible) à 10 (élevé). |
| **Depression\_Level** | Niveau de dépression ressenti. | Entier | Échelle de 1 (faible) à 10 (élevé). |
| **Self\_Esteem** | Niveau d'estime de soi. | Entier | Échelle de 1 (faible) à 10 (élevé). |
| **Parental\_Control** | Présence ou niveau de contrôle parental. | Entier | Binaire (0 ou 1) ou Échelle. |
| **Screen\_Time\_Before\_Bed** | Temps passé sur l'écran juste avant de dormir. | Flottant | En heures. |
| **Phone\_Checks\_Per\_Day** | Nombre de fois où le téléphone est vérifié par jour. | Entier | |
| **Apps\_Used\_Daily** | Nombre d'applications utilisées quotidiennement. | Entier | |
| **Time\_on\_Social\_Media** | Temps passé sur les médias sociaux. | Flottant | En heures. |
| **Time\_on\_Gaming** | Temps passé à jouer. | Flottant | En heures. |
| **Time\_on\_Education** | Temps passé à étudier/apprendre sur le téléphone. | Flottant | En heures. |
| **Phone\_Usage\_Purpose** | But principal de l'utilisation (e.g., *Browsing*, *Social Media*, *Education*). | Catégorique | |
| **Family\_Communication** | Niveau/Fréquence de communication avec la famille. | Entier | Échelle. |
| **Weekend\_Usage\_Hours** | Heures d'utilisation pendant le week-end. | Flottant | En heures. |
| **Addiction\_Level** | **Niveau d'addiction au téléphone.** | Flottant | La variable cible. |

# Pipeline
Notre jeu de données est composé de plusieurs colonnes en rapport avec les activités des adolescents sur les écrans et leur impact. Les sources d’informations sont assez variées. Certaines informations proviennent d’un ressenti personnel, d'autres sont des informations objectives et certaines sont quantifiables tandis que d’autres ne le sont pas.
Cela influe directement sur notre travail de restitution qui se doit de partager un message clair. Pour cette raison, notre pipeline prendra en compte un nombre défini de données qui répond à des besoins que nous allons recenser dans ce document.

Nous avons identifié plusieurs types de tâches en rapport avec notre user target. Le clustering, le tri, la corrélation, l’association et la comparaison. Ces tâches permettent de trouver un objectif à nos visualisations et dirigent nos décisions en ce qui concerne les types de visualisations à choisir ainsi que les interactions qui y seront proposées.

## BubbleMap
Une carte du monde où les adolescents sont regroupés en bulles, chaque bulle est ensuite placée sur la carte selon l’emplacement de sa ville respective. La taille de la bulle correspond au nombre d’adolescents de la ville. La couleur de la bulle correspond à leur moyenne de notes : plus la couleur s’approche du bleu, plus les moyennes sont bonnes, et à l’inverse, plus la bulle s’approche du rouge, plus les notes sont basses.
L’utilisateur a la possibilité de cliquer sur une bulle pour y voir un camembert répertoriant les différents usages et leurs proportions respectives en temps d’écran des adolescents de la ville.

Les tâches rattachées à cette visualisation sont :
```markdown
* Clustering : regroupement des élèves en fonction de leur localisation (ville d’habitation).
* Comparaison des clusters en fonction du nombre d’élèves (tailles des bulles) et de leur note moyenne (couleurs des bulles).
* Tri des différents usages par cluster via le camembert.
* Association des moyennes de notes, du temps de sommeil et des usages lorsque l’on sélectionne une bulle.
```

```markdonw
* Localisation
* Sleep_hours
* Academic_Performance
* Phone_Usage_Purpose
```

## ScatterPlot 

Pour répondre aux tâches de clustering, de comparaison et de tri, le scatter plot est un moyen de visualisation que nous avons jugé optimal. Il possède une lecture accessible et permet l’ajout d’interactions qui répondent à nos tâches.
Les données utilisées pour alimenter ce graphique sont les suivantes : 

| Nom de la colonne | Description | Type de donnée | Notes |
| :--- | :--- | :--- | :--- |
| **Name** | Nom du participant (anonymisé). | Texte | |
| **School\_Grade** | Niveau scolaire du participant. | Catégorique | |
| **Daily\_Usage\_Hours** | Nombre total d'heures d'utilisation du téléphone par jour. | Flottant | En heures. |
| **Sleep\_Hours** | Nombre d'heures de sommeil par nuit. | Flottant | En heures. |
| **Anxiety\_Level** | Niveau d'anxiété ressenti. | Entier | Échelle de 1 (faible) à 10 (élevé). |
| **Apps\_Used\_Daily** | Nombre d'applications utilisées quotidiennement. | Entier | |
| **Time\_on\_Social\_Media** | Temps passé sur les médias sociaux. | Flottant | En heures. |
| **Time\_on\_Gaming** | Temps passé à jouer. | Flottant | En heures. |
| **Time\_on\_Education** | Temps passé à étudier/apprendre sur le téléphone. | Flottant | En heures. |
| **Phone\_Usage\_Purpose** | But principal de l'utilisation (e.g., *Browsing*, *Social Media*, *Education*). | Catégorique | |
| **Family\_Communication** | Niveau/Fréquence de communication avec la famille. | Entier | Échelle. |
| **Weekend\_Usage\_Hours** | Heures d'utilisation pendant le week-end. | Flottant | En heures. |


La visualisation en scatter plot a été pensée pour répondre à un nombre définis de tâches qui sont les suivantes : 

```markdown
* Comparer les notes entre les groupes d'élèves disponibles
* Correler les résultats académiques et le temps d'écran individuel
* Correler les résultats académiques et le niveau d'anxiété
* Trier les personnes par activités principales
* Trier les personnes par groupes de classe
* Associer les activités principales et les résultats académiques
```

Via ces informations, nous sommes capables de comparer les performances académiques de chaque personne en fonction de plusieurs critères dont la classe, l’activité principale, le temps d’écran ou même le niveau d’anxiété. 
Le but étant de visualiser les tendances chez les groupes d’élèves en fonction de critères qui pourront varier comme le temps d’écran par exemple.

## Parallel Coordinates Plot (PCP)

Le Parallel Coordinates Plot permet de visualiser simultanément plusieurs attributs caractérisant l’usage des écrans et ses impacts.
Pour des raisons de lisibilité, nous n’utilisons qu’un échantillon réduit (≈5%) choisi aléatoirement tout en conservant la diversité des profils.

Les données retenues pour cette visualisation sont :

| Nom de la colonne | Description | Type de donnée | Notes |
| :--- | :--- | :--- | :--- |
| **School\_Grade** | Niveau scolaire du participant. | Catégorique | |
| **Daily\_Usage\_Hours** | Nombre total d'heures d'utilisation du téléphone par jour. | Flottant | En heures. |
| **Academic\_Performance** | Score/Pourcentage de performance académique. | Entier | |
| **Anxiety\_Level** | Niveau d'anxiété ressenti. | Entier | Échelle de 1 (faible) à 10 (élevé). |
| **Apps\_Used\_Daily** | Nombre d'applications utilisées quotidiennement. | Entier | |
| **Time\_on\_Education** | Temps passé à étudier/apprendre sur le téléphone. | Flottant | En heures. |
| **Phone\_Usage\_Purpose** | But principal de l'utilisation (e.g., *Browsing*, *Social Media*, *Education*). | Catégorique | |
| **Addiction\_Level** | **Niveau d'addiction au téléphone.** | Flottant | La variable cible. |

Grâce à ce graphique et aux interactions disponibles (filtrage, coloration, survol, brushing), nous pouvons répondre à un ensemble de tâches UX nécessaires pour les équipes pédagogiques :
```markdown

* Comparer les profils d’élèves via plusieurs attributs simultanément
* Corréler le temps d’écran, l’anxiété, l’addiction et la performance académique
* Trier les élèves selon leur activité principale ou leur âge
* Identifier un élève précis via le survol d’une ligne (tooltip avec nom + valeurs)
* Repérer des profils atypiques ou extrêmes (Daily Usage, Anxiety, Addiction Level…)
```
Le PCP permet aux équipes pédagogiques d’observer en un coup d’œil les tendances générales, les relations multivariées entre comportements numériques et performances, les écarts entre groupes d’élèves en fonction de leurs pratiques et les profils particuliers qui mériteraient une attention spécifique, offrant ainsi une analyse complète et complémentaire aux autres visualisations du projet.


