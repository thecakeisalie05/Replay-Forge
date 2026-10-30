use std::env;
use std::fs;
use std::io::{self, Write};

fn run() -> Result<(), Box<dyn std::error::Error>> {
    let input = env::args().nth(1).ok_or("Usage: replay-forge-decoder <replay-file>")?;
    let bytes = fs::read(&input)?;
    let parsed = boxcars::ParserBuilder::new(&bytes)
        .must_parse_network_data()
        .parse()?;
    let stdout = io::stdout();
    let mut lock = stdout.lock();
    serde_json::to_writer(&mut lock, &parsed)?;
    writeln!(&mut lock)?;
    Ok(())
}

fn main() {
    if let Err(e) = run() {
        eprintln!("Replay decode failed: {e}");
        std::process::exit(1);
    }
}
