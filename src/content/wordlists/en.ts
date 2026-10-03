/** Common English words (only characters that can be sent in Morse). */
export const ENGLISH_COMMON = `
the be to of and a in that have i it for not on with he as you do at this but his by from
they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some
could them see other than then now look only come its over think also back after use two how
our work first well way even new want because any these give day most us is was are been has
had were said did made find where much too very still being going why before never here off
again place small found thing man world life hand part child eye woman week case point number
group problem fact old big high different every between last long great little own right
under while home water room mother area money story young month lot right study book job word
business issue side kind head house service friend father power hour game line end member law
car city name team minute idea body back face others level office door health person art war
history party result change morning reason research girl guy moment air teacher force order
radio signal power antenna band wave sound tone key copy speed sun day night rain wind snow
cold warm fine nice happy hope help call ask tell feel try leave put mean keep let begin seem
show hear play run move live believe hold bring happen write provide sit stand lose pay meet
include continue set learn lead understand watch follow stop create speak read allow add spend
grow open walk win offer remember love consider appear buy wait serve die send expect build
stay fall cut reach kill remain suggest raise pass sell require report decide pull return
explain carry develop drive break thank receive join agree pick wear paper river mountain
field tree light street road school family country state system program question government
early late real best better sure free full low true whole clear easy hard strong possible
large black white red blue green dark simple short ready main able human local sure open
`.trim().split(/\s+/).map((w) => w.toUpperCase());
