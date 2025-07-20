export default function TestCSS() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">CSS Test Page</h1>
      
      <div className="grid gap-4 max-w-4xl">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Border Test</h2>
          <p>This box should have a visible border</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Background Test</h2>
          <p>This box should have a gray background</p>
        </div>
        
        <div className="p-4 gradient-bg rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Gradient Background Test</h2>
          <p>This box should have a gradient background</p>
        </div>
        
        <div className="p-4 glass rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Glass Effect Test</h2>
          <p>This box should have a glass morphism effect</p>
        </div>
        
        <div className="p-4">
          <h2 className="text-xl font-semibold gradient-text mb-2">Gradient Text Test</h2>
          <p>The heading above should have gradient text</p>
        </div>
        
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-2 font-khmer">ភាសាខ្មែរ</h2>
          <p className="font-khmer">អក្សរខ្មែរគួរតែបង្ហាញត្រឹមត្រូវ</p>
        </div>
      </div>
    </div>
  );
}